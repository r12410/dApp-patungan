require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://localhost:8545"
    },
    mumbai: {
      url: "https://polygon-testnet.public.blastapi.io",
      chainId: 80001,
      accounts: [`0x${process.env.PRIVATEKEY}`]
    },
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      accounts: [`0x${process.env.PRIVATEKEY}`]
    }
  },
  etherscan: {
    apiKey: process.env.API, // polygonscan.com
  },
  gasReporter: {
    gasPrice: 10,
    currency: "USD",
    enabled: (process.env.GAS_REPORT) ? true : false
  },
};
