// USAGE:
//  node get-airdroplist.js

const Web3 = require('web3');
const any = require('promise.any');
const fs = require('fs');
const axios = require('axios');
const { merkleAirdropAddress } = require('./contracts');
// const merkleAirdropABI = require('./abi.json')
const contractJson = fs.readFileSync('./merkle-abi.json');

const IPFS_BASES = [
    'https://10.via0.com/ipfs',
    'https://ipfs.io/ipfs',
    'https://ipfs.leiyun.org/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
];

function loadMerkleAirdropContract(web3) {
    console.log('Loading contract', merkleAirdropAddress);
    let instance = new web3.eth.Contract(JSON.parse(contractJson), merkleAirdropAddress);
    instance.options.address = merkleAirdropAddress;
    return instance;
}

async function agumentedIpfsGet(hash) {
    const promises = IPFS_BASES.map(ipfsBase => axios.get(`${ipfsBase}/${hash}`));
    if (Promise.any) {
      return await Promise.any(promises);
    } else {
      return await any(promises);
    }
}

async function getAirdropPlan(uri) {
    const hash = uri.replace('/ipfs/', '');
    const resp = await agumentedIpfsGet(hash);
    return resp.data;
}

async function getAirdropLists(contract) {
    console.log('### 1, query airdrop count...');
    const numAirdrop = await contract.methods.airdropsCount().call();
    const uriPromises = []
    console.log('### 2, query airdrop informations...');
    for (let i = 1; i <= numAirdrop; i++) {
      uriPromises.push(contract.methods.airdrops(i).call());
    }
    const airdrops = await Promise.all(uriPromises);
    console.log('### 3, query airdrop plans...');
    const plans = await Promise.all(
      airdrops.map(a => getAirdropPlan(a.dataURI))
    );
    const plansWithStatus = plans.map((a, idx) => {
      return {...a, paused: airdrops[idx].paused};
    });

    return plansWithStatus;
}

async function checkAwarded(contract, id, address) {
    return await contract.methods.awarded(id, address).call();
}

async function main() {
    const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/6d61e7957c1c489ea8141e947447405b'));
    const merkleAirdrop = loadMerkleAirdropContract(web3);

    const plans = await getAirdropLists(merkleAirdrop);
    let jsonStr = JSON.stringify(plans, null, 4);
    console.log('### 4 writing results to file award-plan.json...');
    fs.writeFileSync('./award-plan.json', jsonStr, { encoding: "utf-8", flag:'w' });

    console.log('### 5 filter unaward items and write it to file award.json...');
    let awards_history = [];
    let invalid_address = [];
    for (let plan of plans) {
        for (let award of plan.awards) {
            let history = {
                hasAwarded: true,
                address: award.address,
                amount: award.amount,
                amountWei: award.amountWei,
                id: plan.id,
                paused: plan.paused,
            };
            // ignore address that not valid
            if (web3.utils.isAddress(award.address) === false) {
                invalid_address.push(history);
            } else {
                awards_history.push(history);
            }
        }
    }

    let has_awarded = [];
    for (let plan of plans) {
        console.log(`fetch index ${plan.id}...`);
        let new_record = await Promise.all(
            awards_history
            .filter(item => item.id === plan.id)
            .map((history) => checkAwarded(merkleAirdrop, history.id, history.address)));
        
        for (let record of new_record) {
            has_awarded.push(record);
        }
    }

    awards_history.forEach((history, index) => {
        history.hasAwarded = has_awarded[index];
    });

    fs.writeFileSync('./awards.json', JSON.stringify(awards_history, null, 4), { encoding: "utf-8", flag:'w'});

    console.log('### 6 filter invalid address and write it to file invalid.json...');
    fs.writeFileSync('./invalid.json', JSON.stringify(invalid_address, null, 4), { encoding: "utf-8", flag:'w'});
}

main()
  .catch(console.error)
  .finally(() => process.exit());
