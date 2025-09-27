module oneinch_apt_bridge::package {
    use aptos_framework::code::publish_package_txn;
    use aptos_framework::package;
    use std::signer;

    /// Publish the package
    public fun publish_package(account: &signer, metadata: vector<u8>, code: vector<vector<u8>>) {
        publish_package_txn(account, metadata, code);
    }
}
