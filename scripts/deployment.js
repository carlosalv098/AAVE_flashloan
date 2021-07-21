
const hre = require("hardhat");

async function main() {

  const AAVE = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';
  const AaveFlashloan = await hre.ethers.getContractFactory("AaveFlashloan");
  const aaveFlashloan = await AaveFlashloan.deploy(AAVE);

  await aaveFlashloan.deployed();

  console.log("AaveFlashloan deployed to:", aaveFlashloan.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });