// USAGE: 
//  ENDPOINT=http://localhost:8545 node check-balance.js


require('dotenv').config();
const ethers = require('ethers');
const ERC20Json = require('../build/contracts/SimpleERC20.json');
const PHAAddress = '0xe81C423c8abE530ae41Db3B5d75c5Fecc19e76aD';

const Account = "0xA30F7593194d1DD7BC8565cAE03dEa75f6229e36";

async function main() {
    let env = {};
    env.url = process.env.ENDPOINT || 'http://localhost:8545';
    env.provider = new ethers.providers.JsonRpcProvider(env.url);

    env.PHA = new ethers.Contract(PHAAddress, ERC20Json.abi, env.provider);

    console.log(`balance of ${Account} is: ${await env.PHA.balanceOf(Account)}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit());


