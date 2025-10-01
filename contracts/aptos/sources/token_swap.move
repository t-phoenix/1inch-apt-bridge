//! TokenSwap module for executing token swaps with 1inch integration
//! This module handles the actual token swapping logic using 1inch protocol

module swap_bridge::token_swap {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::table::{Self, Table};
    use aptos_framework::resource_account;
    use aptos_framework::aptos_std::simple_map::{Self, SimpleMap};

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_TOKEN: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;
    const E_INVALID_SLIPPAGE: u64 = 4;
    const E_SWAP_ALREADY_EXECUTED: u64 = 5;
    const E_SWAP_FAILED: u64 = 6;
    const E_INSUFFICIENT_BALANCE: u64 = 7;
    const E_INVALID_ROUTER: u64 = 8;
    const E_INVALID_ESCROW: u64 = 9;

    // Constants
    const MAX_SLIPPAGE: u64 = 5000; // 50%
    const MIN_SLIPPAGE: u64 = 1; // 0.01%
    const DEADLINE_BUFFER: u64 = 300; // 5 minutes

    // Structs
    struct SwapInfo has key {
        executed: bool,
        from_token: String,
        to_token: String,
        from_amount: u64,
        to_amount: u64,
        timestamp: u64,
        executor: address,
    }

    struct TokenSwapConfig has key {
        one_inch_router: address,
        htlc_escrow: address,
        authorized_callers: Table<address, bool>,
        executed_swaps: Table<String, bool>,
        swap_info: Table<String, SwapInfo>,
    }

    struct SwapExecutedEvent has store, drop {
        swap_id: String,
        user: address,
        from_token: String,
        to_token: String,
        from_amount: u64,
        to_amount: u64,
        timestamp: u64,
    }

    struct SwapFailedEvent has store, drop {
        swap_id: String,
        user: address,
        reason: String,
        timestamp: u64,
    }

    struct RouterUpdatedEvent has store, drop {
        old_router: address,
        new_router: address,
        timestamp: u64,
    }

    // Initialize the module
    public fun init(account: &signer) {
        let account_addr = signer::address_of(account);
        
        // Create resource account for the contract
        let (resource_signer, resource_signer_cap) = account::create_resource_account(account, b"token_swap");
        let resource_addr = signer::address_of(&resource_signer);

        // Initialize the config
        move_to(account, TokenSwapConfig {
            one_inch_router: @0x0, // Will be set by owner
            htlc_escrow: @0x0, // Will be set by owner
            authorized_callers: table::new(),
            executed_swaps: table::new(),
            swap_info: table::new(),
        });

        // Set the resource account as authorized caller
        let config = borrow_global_mut<TokenSwapConfig>(account_addr);
        table::add(&mut config.authorized_callers, resource_addr, true);
    }

    // Public functions

    /// Execute a token swap using 1inch protocol
    public fun execute_swap(
        account: &signer,
        swap_id: String,
        from_token: String,
        to_token: String,
        amount: u64,
        min_return_amount: u64,
        slippage: u64,
        swap_data: vector<u8>
    ) acquires TokenSwapConfig {
        let account_addr = signer::address_of(account);
        let config = borrow_global_mut<TokenSwapConfig>(account_addr);

        // Check authorization
        assert!(table::contains(&config.authorized_callers, account_addr), E_NOT_AUTHORIZED);
        
        // Validate inputs
        assert!(string::length(&from_token) > 0, E_INVALID_TOKEN);
        assert!(string::length(&to_token) > 0, E_INVALID_TOKEN);
        assert!(amount > 0, E_INVALID_AMOUNT);
        assert!(slippage >= MIN_SLIPPAGE && slippage <= MAX_SLIPPAGE, E_INVALID_SLIPPAGE);
        assert!(!table::contains(&config.executed_swaps, swap_id), E_SWAP_ALREADY_EXECUTED);

        // Mark swap as executed
        table::add(&mut config.executed_swaps, swap_id, true);

        // Store swap info
        table::add(&mut config.swap_info, swap_id, SwapInfo {
            executed: true,
            from_token,
            to_token,
            amount,
            to_amount: 0, // Will be updated after execution
            timestamp: timestamp::now_seconds(),
            executor: account_addr,
        });

        // Execute the swap
        let success = _execute_swap_internal(
            account,
            from_token,
            to_token,
            amount,
            min_return_amount,
            swap_data
        );

        if (!success) {
            // Revert the executed status
            table::remove(&mut config.executed_swaps, swap_id);
            table::remove(&mut config.swap_info, swap_id);
            
            // Emit failure event
            event::emit(SwapFailedEvent {
                swap_id,
                user: account_addr,
                reason: string::utf8(b"Swap execution failed"),
                timestamp: timestamp::now_seconds(),
            });
            
            abort E_SWAP_FAILED
        };

        // Update swap info with actual return amount
        let swap_info = table::borrow_mut(&mut config.swap_info, swap_id);
        swap_info.to_amount = min_return_amount; // In real implementation, get actual amount

        // Emit success event
        event::emit(SwapExecutedEvent {
            swap_id,
            user: account_addr,
            from_token: swap_info.from_token,
            to_token: swap_info.to_token,
            from_amount: swap_info.from_amount,
            to_amount: swap_info.to_amount,
            timestamp: swap_info.timestamp,
        });
    }

    /// Execute swap for APT
    public fun execute_swap_apt(
        account: &signer,
        swap_id: String,
        to_token: String,
        min_return_amount: u64,
        slippage: u64,
        swap_data: vector<u8>
    ) acquires TokenSwapConfig {
        let account_addr = signer::address_of(account);
        let config = borrow_global_mut<TokenSwapConfig>(account_addr);

        // Check authorization
        assert!(table::contains(&config.authorized_callers, account_addr), E_NOT_AUTHORIZED);
        
        // Validate inputs
        assert!(string::length(&to_token) > 0, E_INVALID_TOKEN);
        assert!(min_return_amount > 0, E_INVALID_AMOUNT);
        assert!(slippage >= MIN_SLIPPAGE && slippage <= MAX_SLIPPAGE, E_INVALID_SLIPPAGE);
        assert!(!table::contains(&config.executed_swaps, swap_id), E_SWAP_ALREADY_EXECUTED);

        // Get APT balance
        let apt_balance = coin::balance<AptosCoin>(account_addr);
        assert!(apt_balance > 0, E_INSUFFICIENT_BALANCE);

        // Mark swap as executed
        table::add(&mut config.executed_swaps, swap_id, true);

        // Store swap info
        table::add(&mut config.swap_info, swap_id, SwapInfo {
            executed: true,
            from_token: string::utf8(b"APT"),
            to_token,
            from_amount: apt_balance,
            to_amount: 0, // Will be updated after execution
            timestamp: timestamp::now_seconds(),
            executor: account_addr,
        });

        // Execute the swap
        let success = _execute_swap_apt_internal(
            account,
            to_token,
            apt_balance,
            min_return_amount,
            swap_data
        );

        if (!success) {
            // Revert the executed status
            table::remove(&mut config.executed_swaps, swap_id);
            table::remove(&mut config.swap_info, swap_id);
            
            // Emit failure event
            event::emit(SwapFailedEvent {
                swap_id,
                user: account_addr,
                reason: string::utf8(b"APT swap execution failed"),
                timestamp: timestamp::now_seconds(),
            });
            
            abort E_SWAP_FAILED
        };

        // Update swap info with actual return amount
        let swap_info = table::borrow_mut(&mut config.swap_info, swap_id);
        swap_info.to_amount = min_return_amount; // In real implementation, get actual amount

        // Emit success event
        event::emit(SwapExecutedEvent {
            swap_id,
            user: account_addr,
            from_token: swap_info.from_token,
            to_token: swap_info.to_token,
            from_amount: swap_info.from_amount,
            to_amount: swap_info.to_amount,
            timestamp: swap_info.timestamp,
        });
    }

    /// Get quote for a token swap
    public fun get_swap_quote(
        from_token: String,
        to_token: String,
        amount: u64
    ): (u64, u64) {
        assert!(string::length(&from_token) > 0, E_INVALID_TOKEN);
        assert!(string::length(&to_token) > 0, E_INVALID_TOKEN);
        assert!(amount > 0, E_INVALID_AMOUNT);

        // This would typically call 1inch's quote API
        // For now, return a simple calculation
        // In production, this should call the actual 1inch quote function
        
        // Placeholder implementation
        let return_amount = amount; // 1:1 for now
        let price_impact = 0; // No price impact for now
        
        (return_amount, price_impact)
    }

    /// Check if a swap has been executed
    public fun is_swap_executed(swap_id: String): bool acquires TokenSwapConfig {
        let config = borrow_global<TokenSwapConfig>(@swap_bridge);
        table::contains(&config.executed_swaps, swap_id)
    }

    /// Get swap information
    public fun get_swap_info(swap_id: String): Option<SwapInfo> acquires TokenSwapConfig {
        let config = borrow_global<TokenSwapConfig>(@swap_bridge);
        if (table::contains(&config.swap_info, swap_id)) {
            let swap_info = table::borrow(&config.swap_info, swap_id);
            option::some(SwapInfo {
                executed: swap_info.executed,
                from_token: swap_info.from_token,
                to_token: swap_info.to_token,
                from_amount: swap_info.from_amount,
                to_amount: swap_info.to_amount,
                timestamp: swap_info.timestamp,
                executor: swap_info.executor,
            })
        } else {
            option::none()
        }
    }

    // Admin functions

    /// Set the 1inch router address
    public fun set_router(account: &signer, new_router: address) acquires TokenSwapConfig {
        let account_addr = signer::address_of(account);
        let config = borrow_global_mut<TokenSwapConfig>(account_addr);
        
        let old_router = config.one_inch_router;
        config.one_inch_router = new_router;
        
        event::emit(RouterUpdatedEvent {
            old_router,
            new_router,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Set the HTLC escrow address
    public fun set_htlc_escrow(account: &signer, new_escrow: address) acquires TokenSwapConfig {
        let account_addr = signer::address_of(account);
        let config = borrow_global_mut<TokenSwapConfig>(account_addr);
        
        config.htlc_escrow = new_escrow;
    }

    /// Add or remove authorized caller
    public fun set_authorized_caller(account: &signer, caller: address, authorized: bool) acquires TokenSwapConfig {
        let account_addr = signer::address_of(account);
        let config = borrow_global_mut<TokenSwapConfig>(account_addr);
        
        if (authorized) {
            table::add(&mut config.authorized_callers, caller, true);
        } else {
            table::remove(&mut config.authorized_callers, caller);
        };
    }

    /// Get contract information
    public fun get_contract_info(): (address, address, u64) acquires TokenSwapConfig {
        let config = borrow_global<TokenSwapConfig>(@swap_bridge);
        let executed_count = table::length(&config.executed_swaps);
        
        (config.one_inch_router, config.htlc_escrow, executed_count)
    }

    // Internal functions

    /// Internal function to execute the actual swap
    fun _execute_swap_internal(
        account: &signer,
        from_token: String,
        to_token: String,
        amount: u64,
        min_return_amount: u64,
        swap_data: vector<u8>
    ): bool {
        // This would typically call 1inch's swap function
        // For now, return true as a placeholder
        // In production, this should call the actual 1inch swap function
        
        true
    }

    /// Internal function to execute APT swap
    fun _execute_swap_apt_internal(
        account: &signer,
        to_token: String,
        amount: u64,
        min_return_amount: u64,
        swap_data: vector<u8>
    ): bool {
        // This would typically call 1inch's swap function for APT
        // For now, return true as a placeholder
        // In production, this should call the actual 1inch swap function
        
        true
    }
}
