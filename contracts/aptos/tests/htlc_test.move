#[test_only]
module oneinch_apt_bridge::htlc_test {
    use std::signer;
    use std::vector;
    use std::string;
    use std::debug;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use oneinch_apt_bridge::htlc;

    // Test accounts
    const ADMIN: address = @0x1;
    const MAKER: address = @0x2;
    const RESOLVER: address = @0x3;
    const RECIPIENT: address = @0x4;

    // Test constants
    const SAFETY_DEPOSIT: u64 = 100000000; // 0.1 APT
    const MIN_TIMELOCK: u64 = 3600; // 1 hour
    const MAX_TIMELOCK: u64 = 86400 * 7; // 7 days
    const SWAP_AMOUNT: u64 = 1000000000; // 10 APT

    // Test setup
    fun setup_test_accounts(): (signer, signer, signer, signer) {
        let admin = account::create_signer_for_testing(ADMIN);
        let maker = account::create_signer_for_testing(MAKER);
        let resolver = account::create_signer_for_testing(RESOLVER);
        let recipient = account::create_signer_for_testing(RECIPIENT);

        // Initialize accounts
        account::create_account_for_test(ADMIN);
        account::create_account_for_test(MAKER);
        account::create_account_for_test(RESOLVER);
        account::create_account_for_test(RECIPIENT);

        // Fund accounts with APT
        aptos_framework::aptos_coin::mint(maker.address(), SWAP_AMOUNT * 2);
        aptos_framework::aptos_coin::mint(resolver.address(), SAFETY_DEPOSIT * 10);

        (admin, maker, resolver, recipient)
    }

    #[test]
    fun test_initialize() {
        let (admin, _maker, _resolver, _recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        // Verify initialization
        assert!(htlc::get_safety_deposit_amount() == SAFETY_DEPOSIT, 0);
        assert!(htlc::get_min_timelock() == MIN_TIMELOCK, 1);
        assert!(htlc::get_max_timelock() == MAX_TIMELOCK, 2);
    }

    #[test]
    fun test_create_escrow_success() {
        let (admin, maker, resolver, recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        // Create swap ID
        let swap_id = string::utf8(b"test-swap-1");
        
        // Create hashlock (simplified for testing)
        let secret = string::bytes(b"secret");
        let hashlock = htlc::keccak256_test(&secret);
        
        // Set future timelock
        let future_time = timestamp::now_seconds() + MIN_TIMELOCK + 100;
        
        // Create escrow
        htlc::create_escrow(
            &resolver,
            swap_id,
            maker.address(),
            recipient.address(),
            SWAP_AMOUNT,
            hashlock,
            future_time,
        );
        
        // Verify swap exists
        assert!(htlc::swap_exists(swap_id), 3);
        
        // Verify swap details
        let swap_opt = htlc::get_swap(swap_id);
        assert!(std::option::is_some(&swap_opt), 4);
        
        let swap = std::option::borrow(&swap_opt);
        assert!(swap.maker == maker.address(), 5);
        assert!(swap.resolver == resolver.address(), 6);
        assert!(swap.recipient == recipient.address(), 7);
        assert!(swap.amount == SWAP_AMOUNT, 8);
        assert!(swap.hashlock == hashlock, 9);
        assert!(swap.timelock == future_time, 10);
        assert!(swap.safety_deposit == SAFETY_DEPOSIT, 11);
        assert!(!swap.redeemed, 12);
        assert!(!swap.refunded, 13);
    }

    #[test]
    #[expected_failure(abort_code = 1)] // ESWAP_ALREADY_EXISTS
    fun test_create_escrow_duplicate_id() {
        let (admin, maker, resolver, recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        let swap_id = string::utf8(b"test-swap-1");
        let secret = string::bytes(b"secret");
        let hashlock = htlc::keccak256_test(&secret);
        let future_time = timestamp::now_seconds() + MIN_TIMELOCK + 100;
        
        // Create first escrow
        htlc::create_escrow(
            &resolver,
            swap_id,
            maker.address(),
            recipient.address(),
            SWAP_AMOUNT,
            hashlock,
            future_time,
        );
        
        // Try to create duplicate
        htlc::create_escrow(
            &resolver,
            swap_id,
            maker.address(),
            recipient.address(),
            SWAP_AMOUNT,
            hashlock,
            future_time,
        );
    }

    #[test]
    #[expected_failure(abort_code = 8)] // EINSUFFICIENT_SAFETY_DEPOSIT
    fun test_create_escrow_insufficient_safety_deposit() {
        let (admin, maker, resolver, recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        // Create a poor resolver account
        let poor_resolver = account::create_signer_for_testing(@0x5);
        account::create_account_for_test(@0x5);
        aptos_framework::aptos_coin::mint(@0x5, SAFETY_DEPOSIT - 1); // Just under required amount
        
        let swap_id = string::utf8(b"test-swap-1");
        let secret = string::bytes(b"secret");
        let hashlock = htlc::keccak256_test(&secret);
        let future_time = timestamp::now_seconds() + MIN_TIMELOCK + 100;
        
        // Should fail due to insufficient safety deposit
        htlc::create_escrow(
            &poor_resolver,
            swap_id,
            maker.address(),
            recipient.address(),
            SWAP_AMOUNT,
            hashlock,
            future_time,
        );
    }

    #[test]
    fun test_redeem_success() {
        let (admin, maker, resolver, recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        let swap_id = string::utf8(b"test-swap-1");
        let secret = string::bytes(b"secret");
        let hashlock = htlc::keccak256_test(&secret);
        let future_time = timestamp::now_seconds() + MIN_TIMELOCK + 100;
        
        // Create escrow
        htlc::create_escrow(
            &resolver,
            swap_id,
            maker.address(),
            recipient.address(),
            SWAP_AMOUNT,
            hashlock,
            future_time,
        );
        
        // Redeem with correct preimage
        htlc::redeem(&resolver, swap_id, secret);
        
        // Verify swap is redeemed
        let swap_opt = htlc::get_swap(swap_id);
        assert!(std::option::is_some(&swap_opt), 14);
        
        let swap = std::option::borrow(&swap_opt);
        assert!(swap.redeemed, 15);
    }

    #[test]
    #[expected_failure(abort_code = 13)] // EINVALID_PREIMAGE
    fun test_redeem_invalid_preimage() {
        let (admin, maker, resolver, recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        let swap_id = string::utf8(b"test-swap-1");
        let secret = string::bytes(b"secret");
        let hashlock = htlc::keccak256_test(&secret);
        let future_time = timestamp::now_seconds() + MIN_TIMELOCK + 100;
        
        // Create escrow
        htlc::create_escrow(
            &resolver,
            swap_id,
            maker.address(),
            recipient.address(),
            SWAP_AMOUNT,
            hashlock,
            future_time,
        );
        
        // Try to redeem with wrong preimage
        let wrong_secret = string::bytes(b"wrong-secret");
        htlc::redeem(&resolver, swap_id, wrong_secret);
    }

    #[test]
    fun test_refund_after_expiry() {
        let (admin, maker, resolver, recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        let swap_id = string::utf8(b"test-swap-1");
        let secret = string::bytes(b"secret");
        let hashlock = htlc::keccak256_test(&secret);
        let past_time = timestamp::now_seconds() + MIN_TIMELOCK - 100; // Past time
        
        // Create escrow
        htlc::create_escrow(
            &resolver,
            swap_id,
            maker.address(),
            recipient.address(),
            SWAP_AMOUNT,
            hashlock,
            past_time,
        );
        
        // Wait for expiry
        timestamp::fast_forward_seconds(MIN_TIMELOCK + 200);
        
        // Refund
        htlc::refund(&maker, swap_id);
        
        // Verify swap is refunded
        let swap_opt = htlc::get_swap(swap_id);
        assert!(std::option::is_some(&swap_opt), 16);
        
        let swap = std::option::borrow(&swap_opt);
        assert!(swap.refunded, 17);
    }

    #[test]
    fun test_claim_safety_deposit() {
        let (admin, maker, resolver, recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        let swap_id = string::utf8(b"test-swap-1");
        let secret = string::bytes(b"secret");
        let hashlock = htlc::keccak256_test(&secret);
        let past_time = timestamp::now_seconds() + MIN_TIMELOCK - 100;
        
        // Create escrow
        htlc::create_escrow(
            &resolver,
            swap_id,
            maker.address(),
            recipient.address(),
            SWAP_AMOUNT,
            hashlock,
            past_time,
        );
        
        // Wait for expiry
        timestamp::fast_forward_seconds(MIN_TIMELOCK + 200);
        
        // Claim safety deposit
        htlc::claim_safety_deposit(&maker, swap_id);
        
        // Verify swap is refunded
        let swap_opt = htlc::get_swap(swap_id);
        assert!(std::option::is_some(&swap_opt), 18);
        
        let swap = std::option::borrow(&swap_opt);
        assert!(swap.refunded, 19);
    }

    #[test]
    fun test_admin_functions() {
        let (admin, _maker, _resolver, _recipient) = setup_test_accounts();
        
        // Initialize HTLC
        htlc::initialize(&admin, SAFETY_DEPOSIT, MIN_TIMELOCK, MAX_TIMELOCK);
        
        // Update parameters
        let new_safety_deposit = SAFETY_DEPOSIT * 2;
        let new_min_timelock = MIN_TIMELOCK * 2;
        let new_max_timelock = MAX_TIMELOCK * 2;
        
        htlc::update_parameters(&admin, new_safety_deposit, new_min_timelock, new_max_timelock);
        
        // Verify updates
        assert!(htlc::get_safety_deposit_amount() == new_safety_deposit, 20);
        assert!(htlc::get_min_timelock() == new_min_timelock, 21);
        assert!(htlc::get_max_timelock() == new_max_timelock, 22);
        
        // Test pause/unpause
        htlc::pause(&admin);
        htlc::unpause(&admin);
    }

    #[test]
    fun test_keccak256_compatibility() {
        // Test that our keccak256 implementation produces consistent results
        let secret1 = string::bytes(b"secret");
        let secret2 = string::bytes(b"secret");
        let secret3 = string::bytes(b"different");
        
        let hash1 = htlc::keccak256_test(&secret1);
        let hash2 = htlc::keccak256_test(&secret2);
        let hash3 = htlc::keccak256_test(&secret3);
        
        // Same input should produce same hash
        assert!(hash1 == hash2, 23);
        
        // Different input should produce different hash
        assert!(hash1 != hash3, 24);
        
        // Hash should be 32 bytes
        assert!(vector::length(&hash1) == 32, 25);
    }
}
