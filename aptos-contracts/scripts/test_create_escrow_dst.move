// Test script for create_escrow_dst function
// This script tests the create_escrow_dst entry function

script {
    use bridge::aptos_manager;
    use aptos_framework::object;

    fun test_create_escrow_dst(
        account: &signer,
    ) {
        // HARDCODED PARAMETERS - MODIFY AS NEEDED
        // You need to replace these with actual values
        let order_hash = b"order_hash_123456789"; // REPLACE: Use actual order hash from create_order
        let receiver = @0x789; // REPLACE: Use actual receiver address
        
        // Asset metadata objects - replace with actual asset metadata addresses
        let incentive_feeAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual incentive fee asset metadata
        let depositAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual deposit asset metadata
        
        // Escrow parameters
        let deposit_amount = 10000000; // 10 APT (in smallest units) - MODIFY AS NEEDED
        let incentive_fee = 1000000; // 1 APT (in smallest units) - MODIFY AS NEEDED
        let salt = b"dst_escrow_salt_456"; // MODIFY AS NEEDED
        let hashlock = b"dst_hashlock_789"; // MODIFY AS NEEDED
        
        // Timelock parameters (in seconds from now)
        let withDrawPeriod = 300; // 5 minutes - MODIFY AS NEEDED
        let publicWithDrawPeriod = 600; // 10 minutes - MODIFY AS NEEDED
        let cancelPeriod = 900; // 15 minutes - MODIFY AS NEEDED
        let publicCancelPeriod = 1200; // 20 minutes - MODIFY AS NEEDED

        // Call the create_escrow_dst function
        aptos_manager::create_escrow_dst<object::ObjectCore, object::ObjectCore>(
            account,
            order_hash,
            receiver,
            incentive_feeAssetMetadata,
            depositAssetMetadata,
            deposit_amount,
            incentive_fee,
            salt,
            hashlock,
            withDrawPeriod,
            publicWithDrawPeriod,
            cancelPeriod,
            publicCancelPeriod,
        );
    }
}