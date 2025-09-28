const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy ExtensionsLib
  const ExtensionsLib = await ethers.getContractFactory("ExtensionsLib");
  const extensionsLib = await ExtensionsLib.deploy();
  await extensionsLib.waitForDeployment();
  console.log("ExtensionsLib deployed at:", await extensionsLib.getAddress());

  // Deploy MakerTraitsLib
  const MakerTraitsLib = await ethers.getContractFactory("MakerTraitsLib");
  const makerTraitsLib = await MakerTraitsLib.deploy();
  await makerTraitsLib.waitForDeployment();
  console.log("MakerTraitsLib deployed at:", await makerTraitsLib.getAddress());

  // Link libraries to Resolver
  const Resolver = await ethers.getContractFactory("Resolver", {
    libraries: {
      ExtensionsLib: await extensionsLib.getAddress(),
      MakerTraitsLib: await makerTraitsLib.getAddress(),
    },
  });

  // Deploy Resolver
  const LOP_ADDRESS = "0x...1inch_Limit_Order_Protocol_Address...";
  const INITIAL_OWNER = deployer.address;
  const resolver = await Resolver.deploy(LOP_ADDRESS, "0xFactoryAddress", INITIAL_OWNER);
  await resolver.waitForDeployment();
  console.log("Resolver deployed at:", await resolver.getAddress());
}

main().catch(console.error);
