// Test script for recover function
// This script tests the recover entry function

script {
    use bridge::aptos_manager;
    use aptos_framework::object;

    fun test_recover(
        account: &signer,
    ) {
        // HARDCODED PARAMETERS - MODIFY AS NEEDED
        // You need to replace these with actual values from a created order
        let order_address = @0x123; // REPLACE: Use actual order address from create_order
        
        // Asset metadata objects - replace with actual asset metadata addresses
        let incentive_feeAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual incentive fee asset metadata
        let depositAssetMetadata = object::address_to_object(@usdc); // REPLACE: Use actual deposit asset metadata

        // Call the recover function
        // NOTE: This function can only be called after the recover_timestamp has passed
        // Make sure the order's recover_timestamp is in the past before running this test
        aptos_manager::recover<object::ObjectCore, object::ObjectCore>(
            account,
            order_address,
            incentive_feeAssetMetadata,
            depositAssetMetadata,
        );
    }
}