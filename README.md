# Steps to distribute erc20 token to multi users

## Install deps

```sh
npm i
```

## Compile smart contract

```sh
truffle compile
```

## Deploy MultiSend contract

uncomment ```await deployERC20(env);``` in main() is you want to deploy a test ERC20 token.

```sh
ENDPOINT=<URL> KEY=<Your Key> GASLIMIT=10000000 GASPRICE=50000000000 node deploy.js
```

## Distribut token

call method  ```multi_send_token``` of contract MultiSend.

In our scenario, after set ```BSC_MultiSend``` variable in distribute.js, just run

```sh
ENDPOINT=<BSC URL> KEY=<Your Key> GASLIMIT=10000000 GASPRICE=50000000000 node distribute.js
```

