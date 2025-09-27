// Test script for create_escrow_src function
// This script tests the create_escrow_src entry function

script {
    use bridge::aptos_manager;
    use aptos_framework::object;
    use std::vector;

    fun test_create_escrow_src(
        account: &signer,
    ) {
        // HARDCODED PARAMETERS - MODIFY AS NEEDED
        // You need to replace these with actual values from a created order
        let order_address = @0x123; // REPLACE: Use actual order address from create_order
        
        // Asset metadata objects - replace with actual asset metadata addresses
        let incentive_feeAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual incentive fee asset metadata
        let depositAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual deposit asset metadata
        
        // Escrow parameters
        let makeAmount = 5000000; // 5 APT (in smallest units) - MODIFY AS NEEDED
        let incentive_fee = 500000; // 0.5 APT (in smallest units) - MODIFY AS NEEDED
        let receiver = @0x456; // REPLACE: Use actual receiver address
        let salt = b"escrow_salt_789"; // MODIFY AS NEEDED
        
        // Merkle proof parameters (for multi-fill orders)
        let leaf = b"merkle_leaf_123"; // MODIFY AS NEEDED
        let proof = vector::empty<vector<u8>>(); // Empty proof for single-fill - MODIFY AS NEEDED
        let directions = vector::empty<bool>(); // Empty directions for single-fill - MODIFY AS NEEDED

        // Call the create_escrow_src function
        aptos_manager::create_escrow_src<object::ObjectCore, object::ObjectCore>(
            account,
            order_address,
            incentive_feeAssetMetadata,
            depositAssetMetadata,
            makeAmount,
            incentive_fee,
            receiver,
            salt,
            leaf,
            proof,
            directions,
        );
    }
}