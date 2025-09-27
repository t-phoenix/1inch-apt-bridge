const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deployment parameters
  const SAFETY_DEPOSIT_AMOUNT = ethers.utils.parseEther("0.1"); // 0.1 ETH safety deposit
  const MIN_TIMELOCK = 3600; // 1 hour minimum
  const MAX_TIMELOCK = 86400 * 7; // 7 days maximum

  // Deploy HTLCEscrow contract
  console.log("\nDeploying HTLCEscrow...");
  const HTLCEscrow = await ethers.getContractFactory("HTLCEscrow");
  const htlcEscrow = await HTLCEscrow.deploy(
    SAFETY_DEPOSIT_AMOUNT,
    MIN_TIMELOCK,
    MAX_TIMELOCK
  );

  await htlcEscrow.deployed();

  console.log("HTLCEscrow deployed to:", htlcEscrow.address);
  console.log("Safety deposit amount:", ethers.utils.formatEther(SAFETY_DEPOSIT_AMOUNT), "ETH");
  console.log("Min timelock:", MIN_TIMELOCK, "seconds");
  console.log("Max timelock:", MAX_TIMELOCK, "seconds");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contracts: {
      HTLCEscrow: {
        address: htlcEscrow.address,
        safetyDepositAmount: SAFETY_DEPOSIT_AMOUNT.toString(),
        minTimelock: MIN_TIMELOCK,
        maxTimelock: MAX_TIMELOCK,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
      },
    },
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contract on Etherscan (if not on hardhat network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await htlcEscrow.deployTransaction.wait(6);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: htlcEscrow.address,
        constructorArguments: [
          SAFETY_DEPOSIT_AMOUNT,
          MIN_TIMELOCK,
          MAX_TIMELOCK,
        ],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\nDeployment completed!");
  console.log("Update your .env file with:");
  console.log(`HTLC_ESCROW_ADDRESS_${network.name.toUpperCase()}=${htlcEscrow.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
