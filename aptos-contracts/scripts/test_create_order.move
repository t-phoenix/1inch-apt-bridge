// Test script for create_order function
// This script tests the create_order entry function

script {
    use bridge::aptos_manager;
    use aptos_framework::object;
    use std::vector;

    fun test_create_order(
        resolver: &signer,
        account: &signer,
    ) {

        // HARDCODED PARAMETERS - MODIFY AS NEEDED
        // You need to replace these with actual asset metadata objects
        // These are placeholder addresses - replace with real asset metadata addresses
        let depositAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual deposit asset metadata
        let incentive_feeAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual incentive fee asset metadata
        
        // Order parameters
        let recover_incentive_fee = 10000000; // 0.1 USDC (in smallest units) - MODIFY AS NEEDED
        let recoverPeriod = 3600; // 1 hour in seconds - MODIFY AS NEEDED
        let deposit_amount = 100000000; // 1 USDC (in smallest units) - MODIFY AS NEEDED
        let min_incentive_fee = 1000000; // 0.01 USDC (in smallest units) - MODIFY AS NEEDED
        let salt = b"test_salt_123"; // MODIFY AS NEEDED
        let hashlock = b"test_hashlock_456"; // MODIFY AS NEEDED
        let allow_multi_fill = false; // MODIFY AS NEEDED
        let whitelisted_addresses = vector::empty<address>(); // Empty for no whitelist - MODIFY AS NEEDED
        
        // Timelock parameters (in seconds from now)
        let withDrawPeriod = 300; // 5 minutes - MODIFY AS NEEDED
        let publicWithDrawPeriod = 600; // 10 minutes - MODIFY AS NEEDED
        let cancelPeriod = 900; // 15 minutes - MODIFY AS NEEDED
        let publicCancelPeriod = 1200; // 20 minutes - MODIFY AS NEEDED

        // Call the create_order function
        aptos_manager::create_order<object::ObjectCore>(
            resolver,
            account,
            depositAssetMetadata,
            incentive_feeAssetMetadata,
            recover_incentive_fee,
            recoverPeriod,
            deposit_amount,
            min_incentive_fee,
            salt,
            hashlock,
            allow_multi_fill,
            whitelisted_addresses,
            withDrawPeriod,
            publicWithDrawPeriod,
            cancelPeriod,
            publicCancelPeriod,
        );
    }
}