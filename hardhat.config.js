
require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

const fs = require("fs");
const privateKey = fs.readFileSync(".secret").toString().trim();
const zoraPrivateKey = process.env.PRIVATE_KEY;
const mumbai_url = "insert url endpoint here";
const mainnet_url = "insert url endpoint here";
const rinkeby_url = "https://eth-rinkeby.alchemyapi.io/v2/JnCCoZ3_jXyqns-7ihfn-n9tRU8nzWYN"


module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337
    },
    mumbai: {
      url: mumbai_url,
      accounts: [privateKey]
    },
    rinkeby: {
      url: rinkeby_url,
      accounts: [zoraPrivateKey]
    },
    //mainnet: {
      //url: mainnet_url,
      //accounts: [privateKey]
    //}
  },
  solidity: "0.8.4",
};
