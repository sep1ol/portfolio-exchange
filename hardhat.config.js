require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKeys = process.env.PRIVATE_KEYS.split(",") || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: privateKeys,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: privateKeys,
    },
  },
};

// "31337": {
//   "name": "Localhost",
//   "chainId_hexa": "0x7A69",
//   "explorerURL": "#",
//   "faucet": "",
//   "giveawayContract": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
//   "exchange":{
//       "address": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
//   },
//   "sep1ol":{
//       "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
//   },
//   "mETH":{
//       "address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
//   },
//   "mUSDT":{
//       "address": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
//   }
// },
