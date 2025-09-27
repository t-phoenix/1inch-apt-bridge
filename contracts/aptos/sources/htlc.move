module oneinch_apt_bridge::htlc {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::error;
    use std::debug;
    use std::table::{Self, Table};
    use std::option::{Self, Option};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::aptos_coin;

    // ============================================
    // Errors
    // ============================================

    const ESWAP_ALREADY_EXISTS: u64 = 1;
    const ESWAP_NOT_FOUND: u64 = 2;
    const EINVALID_SENDER: u64 = 3;
    const EINVALID_RECIPIENT: u64 = 4;
    const EINVALID_AMOUNT: u64 = 5;
    const EINVALID_HASHLOCK: u64 = 6;
    const EINVALID_TIMELOCK: u64 = 7;
    const EINSUFFICIENT_SAFETY_DEPOSIT: u64 = 8;
    const EALREADY_REDEEMED: u64 = 9;
    const EALREADY_REFUNDED: u64 = 10;
    const ESWAP_EXPIRED: u64 = 11;
    const ESWAP_NOT_EXPIRED: u64 = 12;
    const EINVALID_PREIMAGE: u64 = 13;
    const EUNAUTHORIZED: u64 = 14;
    const EINSUFFICIENT_BALANCE: u64 = 15;
    const EONLY_OWNER: u64 = 16;
    const EPAUSED: u64 = 17;

    // ============================================
    // Structs
    // ============================================

    /// Swap data structure
    struct Swap has store {
        maker: address,           // User creating the swap
        resolver: address,        // User fulfilling the swap
        recipient: address,       // Final recipient of funds
        amount: u64,             // Swap amount
        hashlock: vector<u8>,     // Hash of the secret (keccak256(preimage))
        timelock: u64,           // Unix timestamp when swap expires
        safety_deposit: u64,     // Safety deposit from resolver
        redeemed: bool,          // Whether swap has been redeemed
        refunded: bool,          // Whether swap has been refunded
        created_at: u64,         // Timestamp when swap was created
    }

    /// Global state for the HTLC module
    struct HTLCStore has key {
        swaps: Table<String, Swap>,
        safety_deposit_amount: u64,
        min_timelock: u64,
        max_timelock: u64,
        owner: address,
        paused: bool,
        escrow_created_events: EventHandle<EscrowCreatedEvent>,
        redeemed_events: EventHandle<RedeemedEvent>,
        refunded_events: EventHandle<RefundedEvent>,
        safety_deposit_claimed_events: EventHandle<SafetyDepositClaimedEvent>,
        parameters_updated_events: EventHandle<ParametersUpdatedEvent>,
    }

    // ============================================
    // Events
    // ============================================

    struct EscrowCreatedEvent has store, drop {
        swap_id: String,
        maker: address,
        resolver: address,
        recipient: address,
        amount: u64,
        hashlock: vector<u8>,
        timelock: u64,
        safety_deposit: u64,
    }

    struct RedeemedEvent has store, drop {
        swap_id: String,
        redeemer: address,
        preimage: vector<u8>,
    }

    struct RefundedEvent has store, drop {
        swap_id: String,
        refunder: address,
    }

    struct SafetyDepositClaimedEvent has store, drop {
        swap_id: String,
        claimant: address,
        amount: u64,
    }

    struct ParametersUpdatedEvent has store, drop {
        safety_deposit_amount: u64,
        min_timelock: u64,
        max_timelock: u64,
    }

    // ============================================
    // Initialization
    // ============================================

    /// Initialize the HTLC module
    public fun initialize(
        account: &signer,
        safety_deposit_amount: u64,
        min_timelock: u64,
        max_timelock: u64,
    ) {
        let account_addr = signer::address_of(account);
        
        // Ensure the account has the signer capability
        aptos_framework::account::assert_account_exists(account_addr);
        
        move_to(account, HTLCStore {
            swaps: table::new(),
            safety_deposit_amount,
            min_timelock,
            max_timelock,
            owner: account_addr,
            paused: false,
            escrow_created_events: account::new_event_handle<EscrowCreatedEvent>(account),
            redeemed_events: account::new_event_handle<RedeemedEvent>(account),
            refunded_events: account::new_event_handle<RefundedEvent>(account),
            safety_deposit_claimed_events: account::new_event_handle<SafetyDepositClaimedEvent>(account),
            parameters_updated_events: account::new_event_handle<ParametersUpdatedEvent>(account),
        });
    }

    // ============================================
    // Core HTLC Functions
    // ============================================

    /// Create a new HTLC escrow with atomic fund transfer
    public fun create_escrow(
        account: &signer,
        swap_id: String,
        maker: address,
        recipient: address,
        amount: u64,
        hashlock: vector<u8>,
        timelock: u64,
    ) acquires HTLCStore {
        let account_addr = signer::address_of(account);
        let htlc_store = borrow_global_mut<HTLCStore>(@oneinch_apt_bridge);
        
        // Check if paused
        assert!(!htlc_store.paused, error::permission_denied(EPAUSED));
        
        // Validate inputs
        assert!(table::contains(&htlc_store.swaps, swap_id), ESWAP_ALREADY_EXISTS);
        assert!(maker != @0x0, error::invalid_argument(EINVALID_SENDER));
        assert!(recipient != @0x0, error::invalid_argument(EINVALID_RECIPIENT));
        assert!(amount > 0, error::invalid_argument(EINVALID_AMOUNT));
        assert!(vector::length(&hashlock) == 32, error::invalid_argument(EINVALID_HASHLOCK));
        assert!(timelock >= timestamp::now_seconds() + htlc_store.min_timelock, error::invalid_argument(EINVALID_TIMELOCK));
        assert!(timelock <= timestamp::now_seconds() + htlc_store.max_timelock, error::invalid_argument(EINVALID_TIMELOCK));

        // Check safety deposit
        let aptos_coin = coin::withdraw<AptosCoin>(account, htlc_store.safety_deposit_amount);
        assert!(coin::value(&aptos_coin) >= htlc_store.safety_deposit_amount, error::invalid_argument(EINSUFFICIENT_SAFETY_DEPOSIT));

        // Transfer APT from maker to this account
        let maker_coin = coin::withdraw<AptosCoin>(account, amount);
        let escrow_coin = coin::withdraw<AptosCoin>(account, 0); // Create empty coin
        coin::merge(&mut escrow_coin, maker_coin);

        // Create swap record
        let swap = Swap {
            maker,
            resolver: account_addr,
            recipient,
            amount,
            hashlock,
            timelock,
            safety_deposit: coin::value(&aptos_coin),
            redeemed: false,
            refunded: false,
            created_at: timestamp::now_seconds(),
        };

        // Store the swap
        table::add(&mut htlc_store.swaps, swap_id, swap);

        // Emit event
        event::emit_event(&mut htlc_store.escrow_created_events, EscrowCreatedEvent {
            swap_id,
            maker,
            resolver: account_addr,
            recipient,
            amount,
            hashlock,
            timelock,
            safety_deposit: coin::value(&aptos_coin),
        });

        // Destroy the coins (they're now locked in the contract)
        coin::destroy_zero(aptos_coin);
        coin::destroy_zero(escrow_coin);
    }

    /// Redeem the swap by providing the correct preimage
    public fun redeem(
        account: &signer,
        swap_id: String,
        preimage: vector<u8>,
    ) acquires HTLCStore {
        let account_addr = signer::address_of(account);
        let htlc_store = borrow_global_mut<HTLCStore>(@oneinch_apt_bridge);
        
        // Check if paused
        assert!(!htlc_store.paused, error::permission_denied(EPAUSED));
        
        // Get swap
        assert!(table::contains(&htlc_store.swaps, swap_id), ESWAP_NOT_FOUND);
        let swap = table::borrow_mut(&mut htlc_store.swaps, swap_id);
        
        // Validate swap state
        assert!(!swap.redeemed, error::invalid_state(EALREADY_REDEEMED));
        assert!(!swap.refunded, error::invalid_state(EALREADY_REFUNDED));
        assert!(timestamp::now_seconds() <= swap.timelock, error::invalid_state(ESWAP_EXPIRED));
        
        // Validate preimage (keccak256 hash)
        let computed_hash = keccak256(&preimage);
        assert!(computed_hash == swap.hashlock, error::invalid_argument(EINVALID_PREIMAGE));

        // Mark as redeemed
        swap.redeemed = true;

        // Transfer APT to recipient
        let recipient_coin = coin::withdraw<AptosCoin>(account, swap.amount);
        coin::deposit(swap.recipient, recipient_coin);

        // Return safety deposit to resolver
        if (swap.safety_deposit > 0) {
            let safety_coin = coin::withdraw<AptosCoin>(account, swap.safety_deposit);
            coin::deposit(swap.resolver, safety_coin);
        };

        // Emit event
        event::emit_event(&mut htlc_store.redeemed_events, RedeemedEvent {
            swap_id,
            redeemer: account_addr,
            preimage,
        });
    }

    /// Refund the swap after timelock expires
    public fun refund(
        account: &signer,
        swap_id: String,
    ) acquires HTLCStore {
        let account_addr = signer::address_of(account);
        let htlc_store = borrow_global_mut<HTLCStore>(@oneinch_apt_bridge);
        
        // Check if paused
        assert!(!htlc_store.paused, error::permission_denied(EPAUSED));
        
        // Get swap
        assert!(table::contains(&htlc_store.swaps, swap_id), ESWAP_NOT_FOUND);
        let swap = table::borrow_mut(&mut htlc_store.swaps, swap_id);
        
        // Validate swap state
        assert!(!swap.redeemed, error::invalid_state(EALREADY_REDEEMED));
        assert!(!swap.refunded, error::invalid_state(EALREADY_REFUNDED));
        assert!(timestamp::now_seconds() > swap.timelock, error::invalid_state(ESWAP_NOT_EXPIRED));
        assert!(account_addr == swap.maker || account_addr == swap.resolver, error::permission_denied(EUNAUTHORIZED));

        // Mark as refunded
        swap.refunded = true;

        // Return APT to maker
        let maker_coin = coin::withdraw<AptosCoin>(account, swap.amount);
        coin::deposit(swap.maker, maker_coin);

        // Return safety deposit to resolver
        if (swap.safety_deposit > 0) {
            let safety_coin = coin::withdraw<AptosCoin>(account, swap.safety_deposit);
            coin::deposit(swap.resolver, safety_coin);
        };

        // Emit event
        event::emit_event(&mut htlc_store.refunded_events, RefundedEvent {
            swap_id,
            refunder: account_addr,
        });
    }

    /// Claim safety deposit when resolver fails to fulfill swap
    public fun claim_safety_deposit(
        account: &signer,
        swap_id: String,
    ) acquires HTLCStore {
        let account_addr = signer::address_of(account);
        let htlc_store = borrow_global_mut<HTLCStore>(@oneinch_apt_bridge);
        
        // Check if paused
        assert!(!htlc_store.paused, error::permission_denied(EPAUSED));
        
        // Get swap
        assert!(table::contains(&htlc_store.swaps, swap_id), ESWAP_NOT_FOUND);
        let swap = table::borrow_mut(&mut htlc_store.swaps, swap_id);
        
        // Validate swap state
        assert!(!swap.redeemed, error::invalid_state(EALREADY_REDEEMED));
        assert!(!swap.refunded, error::invalid_state(EALREADY_REFUNDED));
        assert!(timestamp::now_seconds() > swap.timelock, error::invalid_state(ESWAP_NOT_EXPIRED));
        assert!(account_addr == swap.maker, error::permission_denied(EUNAUTHORIZED));

        let deposit_amount = swap.safety_deposit;
        assert!(deposit_amount > 0, error::invalid_state(EINSUFFICIENT_BALANCE));

        // Mark as refunded (safety deposit claimed)
        swap.refunded = true;

        // Return APT to maker
        let maker_coin = coin::withdraw<AptosCoin>(account, swap.amount);
        coin::deposit(swap.maker, maker_coin);

        // Send safety deposit to maker
        let safety_coin = coin::withdraw<AptosCoin>(account, deposit_amount);
        coin::deposit(swap.maker, safety_coin);

        // Emit event
        event::emit_event(&mut htlc_store.safety_deposit_claimed_events, SafetyDepositClaimedEvent {
            swap_id,
            claimant: account_addr,
            amount: deposit_amount,
        });
    }

    // ============================================
    // View Functions
    // ============================================

    /// Get swap details
    public fun get_swap(swap_id: String): Option<Swap> acquires HTLCStore {
        let htlc_store = borrow_global<HTLCStore>(@oneinch_apt_bridge);
        if (table::contains(&htlc_store.swaps, swap_id)) {
            option::some(*table::borrow(&htlc_store.swaps, swap_id))
        } else {
            option::none()
        }
    }

    /// Check if swap exists
    public fun swap_exists(swap_id: String): bool acquires HTLCStore {
        let htlc_store = borrow_global<HTLCStore>(@oneinch_apt_bridge);
        table::contains(&htlc_store.swaps, swap_id)
    }

    /// Check if swap is expired
    public fun is_expired(swap_id: String): bool acquires HTLCStore {
        let htlc_store = borrow_global<HTLCStore>(@oneinch_apt_bridge);
        if (table::contains(&htlc_store.swaps, swap_id)) {
            let swap = table::borrow(&htlc_store.swaps, swap_id);
            timestamp::now_seconds() > swap.timelock
        } else {
            false
        }
    }

    /// Get safety deposit amount
    public fun get_safety_deposit_amount(): u64 acquires HTLCStore {
        let htlc_store = borrow_global<HTLCStore>(@oneinch_apt_bridge);
        htlc_store.safety_deposit_amount
    }

    /// Get min timelock
    public fun get_min_timelock(): u64 acquires HTLCStore {
        let htlc_store = borrow_global<HTLCStore>(@oneinch_apt_bridge);
        htlc_store.min_timelock
    }

    /// Get max timelock
    public fun get_max_timelock(): u64 acquires HTLCStore {
        let htlc_store = borrow_global<HTLCStore>(@oneinch_apt_bridge);
        htlc_store.max_timelock
    }

    // ============================================
    // Admin Functions
    // ============================================

    /// Update safety deposit and timelock parameters
    public fun update_parameters(
        account: &signer,
        safety_deposit_amount: u64,
        min_timelock: u64,
        max_timelock: u64,
    ) acquires HTLCStore {
        let account_addr = signer::address_of(account);
        let htlc_store = borrow_global_mut<HTLCStore>(@oneinch_apt_bridge);
        
        assert!(account_addr == htlc_store.owner, error::permission_denied(EONLY_OWNER));
        assert!(min_timelock <= max_timelock, error::invalid_argument(EINVALID_TIMELOCK));
        
        htlc_store.safety_deposit_amount = safety_deposit_amount;
        htlc_store.min_timelock = min_timelock;
        htlc_store.max_timelock = max_timelock;
        
        event::emit_event(&mut htlc_store.parameters_updated_events, ParametersUpdatedEvent {
            safety_deposit_amount,
            min_timelock,
            max_timelock,
        });
    }

    /// Pause the contract in case of emergency
    public fun pause(account: &signer) acquires HTLCStore {
        let account_addr = signer::address_of(account);
        let htlc_store = borrow_global_mut<HTLCStore>(@oneinch_apt_bridge);
        
        assert!(account_addr == htlc_store.owner, error::permission_denied(EONLY_OWNER));
        htlc_store.paused = true;
    }

    /// Unpause the contract
    public fun unpause(account: &signer) acquires HTLCStore {
        let account_addr = signer::address_of(account);
        let htlc_store = borrow_global_mut<HTLCStore>(@oneinch_apt_bridge);
        
        assert!(account_addr == htlc_store.owner, error::permission_denied(EONLY_OWNER));
        htlc_store.paused = false;
    }

    // ============================================
    // Utility Functions
    // ============================================

    /// Keccak256 hash function (simplified implementation)
    /// In production, this should use a proper keccak256 implementation
    native fun keccak256(data: &vector<u8>): vector<u8>;

    /// Helper function to create swap ID from string
    public fun create_swap_id(prefix: String, maker: address, resolver: address, amount: u64): String {
        // This is a simplified implementation
        // In production, you might want to use a more sophisticated ID generation
        string::utf8(b"swap_")
    }

    #[test_only]
    /// Initialize for testing
    public fun initialize_for_test(
        account: &signer,
        safety_deposit_amount: u64,
        min_timelock: u64,
        max_timelock: u64,
    ) {
        initialize(account, safety_deposit_amount, min_timelock, max_timelock);
    }

    #[test_only]
    /// Mock keccak256 for testing
    public fun keccak256_test(data: &vector<u8>): vector<u8> {
        // Simple hash for testing - replace with actual keccak256 in production
        let result = vector::empty<u8>();
        let i = 0;
        while (i < 32) {
            if (i < vector::length(data)) {
                vector::push_back(&mut result, *vector::borrow(data, i));
            } else {
                vector::push_back(&mut result, 0);
            };
            i = i + 1;
        };
        result
    }
}
