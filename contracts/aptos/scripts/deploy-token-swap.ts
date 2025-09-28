// Deploy TokenSwap contract on Aptos
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

async function main() {
  console.log('Deploying TokenSwap contract on Aptos...');

  // Initialize Aptos client
  const config = new AptosConfig({
    network: Network.MAINNET, // Change to TESTNET for testing
    fullnode: process.env.APTOS_NODE_URL || 'https://fullnode.mainnet.aptoslabs.com/v1'
  });
  const aptos = new Aptos(config);

  // Create account from private key
  const privateKey = new Ed25519PrivateKey(process.env.APTOS_PRIVATE_KEY || '');
  const account = Account.fromPrivateKey({ privateKey });

  console.log('Deployer address:', account.accountAddress);

  // Get account balance
  const balance = await aptos.getAccountAPTAmount({ accountAddress: account.accountAddress });
  console.log('Account balance:', balance, 'APT');

  if (balance < 0.1) {
    throw new Error('Insufficient balance for deployment. Need at least 0.1 APT');
  }

  // Deploy the contract
  console.log('Deploying contract...');
  
  const transaction = await aptos.publishPackage({
    account,
    packageMetadataBytes: '0x', // Package metadata
    modules: [
      // TokenSwap module bytecode would go here
      // This is a placeholder - in real deployment, you'd compile the Move code
    ],
  });

  console.log('Transaction submitted:', transaction.hash);
  console.log('Waiting for confirmation...');

  // Wait for transaction confirmation
  const result = await aptos.waitForTransaction({
    transactionHash: transaction.hash,
  });

  if (result.success) {
    console.log('TokenSwap contract deployed successfully!');
    console.log('Transaction hash:', transaction.hash);
    console.log('Account address:', account.accountAddress);
    
    // Initialize the contract
    console.log('Initializing contract...');
    
    const initTransaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${account.accountAddress}::token_swap::init`,
        typeArguments: [],
        functionArguments: [],
      },
    });

    const initResult = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: initTransaction,
    });

    console.log('Initialization transaction:', initResult.hash);
    
    const initConfirmation = await aptos.waitForTransaction({
      transactionHash: initResult.hash,
    });

    if (initConfirmation.success) {
      console.log('Contract initialized successfully!');
      
      // Set up initial configuration
      console.log('Setting up initial configuration...');
      
      // Set 1inch router address
      const oneInchRouter = process.env.ONEINCH_ROUTER_ADDRESS_APTOS || '0x0';
      const setRouterTransaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${account.accountAddress}::token_swap::set_router`,
          typeArguments: [],
          functionArguments: [oneInchRouter],
        },
      });

      await aptos.signAndSubmitTransaction({
        signer: account,
        transaction: setRouterTransaction,
      });

      console.log('Router address set:', oneInchRouter);

      // Set HTLC escrow address
      const htlcEscrow = process.env.HTLC_ESCROW_ADDRESS_APTOS || '0x0';
      const setEscrowTransaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${account.accountAddress}::token_swap::set_htlc_escrow`,
          typeArguments: [],
          functionArguments: [htlcEscrow],
        },
      });

      await aptos.signAndSubmitTransaction({
        signer: account,
        transaction: setEscrowTransaction,
      });

      console.log('HTLC escrow address set:', htlcEscrow);

      // Add deployer as authorized caller
      const setAuthTransaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${account.accountAddress}::token_swap::set_authorized_caller`,
          typeArguments: [],
          functionArguments: [account.accountAddress, true],
        },
      });

      await aptos.signAndSubmitTransaction({
        signer: account,
        transaction: setAuthTransaction,
      });

      console.log('Deployer added as authorized caller');

      // Verify deployment
      console.log('Verifying deployment...');
      
      const contractInfo = await aptos.view({
        payload: {
          function: `${account.accountAddress}::token_swap::get_contract_info`,
          typeArguments: [],
          functionArguments: [],
        },
      });

      console.log('Contract Info:', contractInfo);

      const deploymentInfo = {
        network: 'aptos-mainnet',
        tokenSwapAddress: account.accountAddress,
        htlcEscrowAddress: htlcEscrow,
        oneInchRouterAddress: oneInchRouter,
        deployer: account.accountAddress,
        deploymentTime: new Date().toISOString(),
        transactionHash: transaction.hash,
      };

      console.log('Deployment completed successfully!');
      console.log('Deployment Info:', JSON.stringify(deploymentInfo, null, 2));

      return deploymentInfo;
    } else {
      throw new Error('Contract initialization failed');
    }
  } else {
    throw new Error('Contract deployment failed');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
