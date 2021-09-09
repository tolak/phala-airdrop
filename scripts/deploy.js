// USAGE: 
//  ENDPOINT=http://localhost:8545 KEY=<private key> GASLIMIT=10000000 GASPRICE=50000000000 node deploy.js

require('dotenv').config();
const ethers = require('ethers');

const SimpleERC20Json = require('../build/contracts/SimpleERC20.json');
const MultiSendJson = require('../build/contracts/MultiSend.json');

async function deployERC20(env) {
    const factory = new ethers.ContractFactory(SimpleERC20Json.abi, SimpleERC20Json.bytecode, env.wallet);
    const contract = await factory.deploy("PhalaToken", "PHA", ethers.BigNumber.from('1000000000000000000000000'), env.wallet.address, { gasPrice: env.gasPrice, gasLimit: env.gasLimit});
    await contract.deployed();
    env.simpleERC20Contract = contract.address;
    console.log("✓ Simple ERC20 contract deployed");
}

async function deployMultiSend(env) {
    const factory = new ethers.ContractFactory(MultiSendJson.abi, MultiSendJson.bytecode, env.wallet);
    const contract = await factory.deploy({ gasPrice: env.gasPrice, gasLimit: env.gasLimit});
    await contract.deployed();
    env.multiSendContract = contract.address;
    console.log("✓ MultiSend contract deployed");
}

async function main() {
    let env = {};
    env.url = process.env.ENDPOINT || 'http://localhost:8545';
    env.privateKey = process.env.KEY;
    env.provider = new ethers.providers.JsonRpcProvider(env.url);
    env.wallet = new ethers.Wallet(env.privateKey, env.provider);
    env.gasLimit = ethers.utils.hexlify(Number(process.env.GASLIMIT));
    env.gasPrice = ethers.utils.hexlify(Number(process.env.GASPRICE));

    let startBalance = await env.provider.getBalance(env.wallet.address)

    // await deployERC20(env);
    await deployMultiSend(env);

    let deployCost = startBalance.sub((await env.provider.getBalance(env.wallet.address)));

    console.log(`
        ================================================================
        Url:        ${env.url}
        Deployer:   ${env.wallet.address}
        Gas Limit:   ${ethers.BigNumber.from(env.gasLimit)}
        Gas Price:   ${ethers.BigNumber.from(env.gasPrice)}
        Deploy Cost: ${ethers.utils.formatEther(deployCost)}

        
        Contract Addresses
        ================================================================
        SimpleERC20:       ${env.simpleERC20Contract ? env.simpleERC20Contract : "Not Deployed"}
        ----------------------------------------------------------------
        MultiSend:         ${env.multiSendContract ? env.multiSendContract : "Not Deployed"}
        ================================================================
    `);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
