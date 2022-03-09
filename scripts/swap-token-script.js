// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // We get the contract to deploy
  const TokenA = await ethers.getContractFactory("Token");
  const tokenA = await TokenA.deploy("TokenA", "TKA", 10000);
  await tokenA.deployed();

  const TokenB = await ethers.getContractFactory("Token");
  const tokenB = await TokenB.deploy("TokenB", "TKB", 10000);
  await tokenB.deployed();

  // Deploying V1
  const SwapToken = await ethers.getContractFactory("SwapToken");
  const swapTokenInstance = await upgrades.deployProxy(SwapToken, []);
  await swapTokenInstance.deployed();

  console.log("Token A deployed to: ", tokenA.address);
  console.log("Token B deployed to: ", tokenB.address);
  console.log("Swap Token deployed to: ", swapTokenInstance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
