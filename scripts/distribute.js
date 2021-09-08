
// USAGE: 
//  ENDPOINT=http://localhost:8545 KEY=<private key> GASLIMIT=10000000 GASPRICE=50000000000 INDEX=1 node distribute.js

const Web3 = require('web3');
const ethers = require('ethers');
const Awards = require('./awards.json');
const { env } = require('process');
const contractJson = fs.readFileSync('./erc20-abi.json');

const PHAContractAddress = '0x00';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const waitForTx = async (provider, hash) => {
    console.log(`Waiting for tx: ${hash}...`)
    while (!await provider.getTransactionReceipt(hash)) {
        sleep(1000)
    }
}

function loadBSCPHAContract(web3) {
    console.log('Loading contract', PHAContractAddress);
    let instance = new web3.eth.Contract(JSON.parse(contractJson), PHAContractAddress);
    instance.options.address = PHAContractAddress;
    return instance;
}

async function sendAward(env, to, amount) {
    const tx = await env.PHA.transfer(to, amount);
    await waitForTx(env.provider, tx.hash);
}

async function main() {

    let env = {};
    env.url = process.env.ENDPOINT || 'https://mainnet.infura.io/v3/6d61e7957c1c489ea8141e947447405b';
    env.privateKey = process.env.KEY;
    env.provider = new ethers.providers.JsonRpcProvider(env.url);
    env.wallet = new ethers.Wallet(env.privateKey, env.provider);
    env.gasLimit = ethers.utils.hexlify(Number(process.env.GASLIMIT));
    env.gasPrice = ethers.utils.hexlify(Number(process.env.GASPRICE));

    let index = Number(process.env.INDEX);
    console.log(`==> Ready to send awards of plan #${index}`);

    env.PHA = new ethers.Contract(PHAContractAddress, JSON.parse(contractJson), env.wallet);

    let awardList = Awards.filter(award => award.id === index);
    console.log(`there are ${awardList.length()} users to reward...`);
    for (let user of awardList) {
        console.log(`Tring to send ${user.amountWei} PHA to ${user.address}}`);
        sendAward(user.address, user.amountWei);
        console.log(`Send done.`)
    }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
