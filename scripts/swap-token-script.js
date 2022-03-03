// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const TokenA = await hre.ethers.getContractFactory("Token");
  const tokenA = await TokenA.deploy("TokenA", "TKA", 10000);
  await tokenA.deployed();

  const TokenB = await hre.ethers.getContractFactory("Token");
  const tokenB = await TokenB.deploy("Token B", "TKB", 10000);
  await tokenB.deployed();

  const SwapToken = await hre.ethers.getContractFactory("SwapToken");
  const swapToken = await SwapToken.deploy();
  await swapToken.deployed();

  console.log("Token A deployed to: ", tokenA.address);
  console.log("Token B deployed to: ", tokenB.address);
  console.log("Swap Token deployed to: ", swapToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
