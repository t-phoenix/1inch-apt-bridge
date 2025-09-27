import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import fs from "fs";
import path from "path";

// Configuration
const NETWORK = Network.TESTNET; // Change to Network.MAINNET for production
const PRIVATE_KEY = process.env.APTOS_PRIVATE_KEY || "";
const MODULE_ADDRESS = "0x1"; // This will be updated after deployment

// Initialize Aptos client
const config = new AptosConfig({ network: NETWORK });
const aptos = new Aptos(config);

async function deployHTLC() {
  try {
    console.log("🚀 Starting Aptos HTLC contract deployment...");
    
    // Create account from private key
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });
    
    console.log(`📝 Deploying from account: ${account.accountAddress}`);
    
    // Check account balance
    const balance = await aptos.getAccountAPTAmount({ accountAddress: account.accountAddress });
    console.log(`💰 Account balance: ${balance} APT`);
    
    if (balance < 1) {
      throw new Error("Insufficient balance for deployment. Need at least 1 APT.");
    }

    // Read contract bytecode
    const contractPath = path.join(__dirname, "../build/oneinch_apt_bridge/bytecode_modules/htlc.mv");
    
    if (!fs.existsSync(contractPath)) {
      throw new Error("Contract bytecode not found. Please compile the contracts first.");
    }

    const moduleBytecode = fs.readFileSync(contractPath);
    
    // Deployment parameters
    const SAFETY_DEPOSIT_AMOUNT = 100000000; // 0.1 APT in octas
    const MIN_TIMELOCK = 3600; // 1 hour
    const MAX_TIMELOCK = 86400 * 7; // 7 days

    // Deploy the contract
    console.log("📦 Publishing HTLC module...");
    
    const publishResponse = await aptos.publishPackageTransaction({
      account,
      modules: [moduleBytecode],
      metadata: {
        name: "oneinch_apt_bridge",
        version: "1.0.0",
        description: "HTLC contract for 1inch-apt-bridge cross-chain swaps",
      },
    });

    console.log(`✅ Transaction submitted: ${publishResponse.hash}`);
    
    // Wait for transaction confirmation
    const transaction = await aptos.waitForTransaction({
      transactionHash: publishResponse.hash,
    });

    if (transaction.success) {
      console.log("🎉 HTLC contract deployed successfully!");
      console.log(`📍 Contract address: ${account.accountAddress}`);
      console.log(`🔗 Transaction hash: ${publishResponse.hash}`);
      console.log(`🌐 Explorer: https://explorer.aptoslabs.com/txn/${publishResponse.hash}?network=${NETWORK}`);
      
      // Initialize the contract
      console.log("\n🔧 Initializing contract...");
      
      const initResponse = await aptos.transaction({
        sender: account.accountAddress,
        data: {
          function: `${account.accountAddress}::htlc::initialize`,
          typeArguments: [],
          functionArguments: [
            SAFETY_DEPOSIT_AMOUNT,
            MIN_TIMELOCK,
            MAX_TIMELOCK,
          ],
        },
      });

      await aptos.waitForTransaction({
        transactionHash: initResponse.hash,
      });

      console.log("✅ Contract initialized successfully!");
      
      // Save deployment info
      const deploymentInfo = {
        network: NETWORK,
        contractAddress: account.accountAddress,
        transactionHash: publishResponse.hash,
        initTransactionHash: initResponse.hash,
        safetyDepositAmount: SAFETY_DEPOSIT_AMOUNT,
        minTimelock: MIN_TIMELOCK,
        maxTimelock: MAX_TIMELOCK,
        deployedAt: new Date().toISOString(),
        deployer: account.accountAddress,
      };

      const outputPath = path.join(__dirname, `../deployments/${NETWORK}.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
      
      console.log("\n📋 Deployment Summary:");
      console.log(JSON.stringify(deploymentInfo, null, 2));
      
      console.log("\n🔧 Update your .env file with:");
      console.log(`HTLC_ESCROW_ADDRESS_APTOS=${account.accountAddress}`);
      
    } else {
      throw new Error("Transaction failed");
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run deployment
deployHTLC();
