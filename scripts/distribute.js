
// USAGE: 
//  ENDPOINT=http://localhost:8545 KEY=<private key> GASLIMIT=10000000 GASPRICE=50000000000 node distribute.js

require('dotenv').config();
const ethers = require('ethers');
const Awards = require('./awards.json');
const fs = require('fs');
const _ = require('lodash');

const MultiSendJson = require('../build/contracts/MultiSend.json');
const ERC20Json = require('../build/contracts/SimpleERC20.json');

const BSC_PHA = '0x0112e557d400474717056c4e6d40edd846f38351';
const BSC_MultiSend = '';
const MultiSendAddress = BSC_MultiSend;
const PHAAddress = BSC_PHA;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const waitForTx = async (provider, hash) => {
    console.log(`Waiting for tx: ${hash}...`)
    while (!await provider.getTransactionReceipt(hash)) {
        sleep(1000)
    }
}

async function sendAward(env, chunk) {
    let address = chunk.map(obj => obj.address);
    let amounts = chunk.map(obj => obj.amount);

    const tx = await env.MultiSend.multi_send_token(PHAAddress, address, amounts);
    await waitForTx(env.provider, tx.hash);
}

async function main() {

    let env = {};
    env.url = process.env.ENDPOINT || 'http://localhost:8545';
    env.privateKey = process.env.KEY;
    env.provider = new ethers.providers.JsonRpcProvider(env.url);
    env.wallet = new ethers.Wallet(env.privateKey, env.provider);
    env.gasLimit = ethers.utils.hexlify(Number(process.env.GASLIMIT));
    env.gasPrice = ethers.utils.hexlify(Number(process.env.GASPRICE));

    env.MultiSend = new ethers.Contract(MultiSendAddress, MultiSendJson.abi, env.wallet);
    env.PHA = new ethers.Contract(PHAAddress, ERC20Json.abi, env.wallet);

    console.log('Approve MultiSend contract...');
    await env.PHA.approve(MultiSendAddress, ethers.constants.MaxUint256);

    let awardList = Awards.filter(award => award.hasAwarded === false).map(award => {
        return {
            address: award.address,
            amount: award.amountWei
        };
    });

    console.log('arward list length: ', awardList.length);
    let chunks = _.chunk(awardList, 100);
    for (let index = 0; index < chunks.length; index++) {
        console.log(`==> Trying to send ${index}/${chunks.length}...`);
        await sendAward(env, chunks[index]);
        console.log(`Chunk ${index} send done.`);
    }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
