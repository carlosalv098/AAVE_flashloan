require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      forking: {
        url: 'https://mainnet.infura.io/v3/afbd453d933149dfb8191f9b74db2c02'
      }
    }
  }
};
