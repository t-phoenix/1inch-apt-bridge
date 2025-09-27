// Test script for withdraw function
// This script tests the withdraw entry function

script {
    use bridge::aptos_manager;
    use aptos_framework::object;

    fun test_withdraw(
        account: &signer,
    ) {
        // HARDCODED PARAMETERS - MODIFY AS NEEDED
        // You need to replace these with actual values from a created escrow
        let vault_address = @0x456; // REPLACE: Use actual escrow vault address from create_escrow_src or create_escrow_dst
        
        // Asset metadata objects - replace with actual asset metadata addresses
        let incentive_feeAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual incentive fee asset metadata
        let depositAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual deposit asset metadata
        
        // Secret that matches the hashlock
        // This should be the preimage of the hashlock used when creating the escrow
        let secret = b"secret_preimage_123"; // REPLACE: Use actual secret that hashes to the escrow's hashlock

        // Call the withdraw function
        // NOTE: This function can only be called by the receiver or depositor
        // and only after the appropriate timelock period has passed
        // Make sure the timelock conditions are met before running this test
        aptos_manager::withdraw<object::ObjectCore, object::ObjectCore>(
            account,
            vault_address,
            secret,
            incentive_feeAssetMetadata,
            depositAssetMetadata,
        );
    }
}