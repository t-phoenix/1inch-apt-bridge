// Deploy TokenSwap contract
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TokenSwap contract...");

  // Get the contract factory
  const TokenSwap = await ethers.getContractFactory("TokenSwap");

  // Get the HTLCEscrow address (should be deployed first)
  const HTLC_ESCROW_ADDRESS = process.env.HTLC_ESCROW_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  // Get the 1inch router address
  const ONEINCH_ROUTER_ADDRESS = process.env.ONEINCH_ROUTER_ADDRESS || "0x1111111254EEB25477B68fb85Ed929f73A960582";

  console.log("HTLC Escrow Address:", HTLC_ESCROW_ADDRESS);
  console.log("1inch Router Address:", ONEINCH_ROUTER_ADDRESS);

  // Deploy the contract
  const tokenSwap = await TokenSwap.deploy(ONEINCH_ROUTER_ADDRESS, HTLC_ESCROW_ADDRESS);

  await tokenSwap.waitForDeployment();

  const tokenSwapAddress = await tokenSwap.getAddress();

  console.log("TokenSwap deployed to:", tokenSwapAddress);

  // Verify deployment
  console.log("Verifying deployment...");
  
  const contractInfo = await tokenSwap.getContractInfo();
  console.log("Contract Info:", {
    router: contractInfo.router,
    escrow: contractInfo.escrow,
    executedCount: contractInfo.executedCount.toString()
  });

  // Set up initial configuration
  console.log("Setting up initial configuration...");
  
  // Add deployer as authorized caller
  const [deployer] = await ethers.getSigners();
  await tokenSwap.setAuthorizedCaller(deployer.address, true);
  console.log("Added deployer as authorized caller");

  // Verify the setup
  const isAuthorized = await tokenSwap.authorizedCallers(deployer.address);
  console.log("Deployer authorized:", isAuthorized);

  console.log("Deployment completed successfully!");
  console.log("TokenSwap Address:", tokenSwapAddress);
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    tokenSwapAddress: tokenSwapAddress,
    htlcEscrowAddress: HTLC_ESCROW_ADDRESS,
    oneInchRouterAddress: ONEINCH_ROUTER_ADDRESS,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("Deployment Info:", JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
