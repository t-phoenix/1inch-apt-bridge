# 1inch Aptos Bridge Contracts

A hash-locked escrow system for cross-chain token transfers between Aptos and EVM blockchains.

## Overview

This module implements a FusionPlus order system that allows users to create orders and escrows for secure cross-chain token transfers using hash-locked timelock contracts.

## Compilation & Deployment

### Prerequisites
- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli/) installed
- Aptos account with sufficient funds for deployment

### Compile
```bash
aptos move compile
```

### Deploy
```bash
# Deploy to testnet
aptos move publish --profile testnet

# Deploy to mainnet
aptos move publish --profile mainnet
```

### Test
```bash
# Run all tests
aptos move test

# Run specific test
aptos move test --filter test_create_order
```

## Functions

### Core Functions

- **`create_order`** - Creates a new FusionPlus order with deposit and timelock parameters
- **`create_escrow_src`** - Creates a source escrow from an existing order with merkle proof validation
- **`create_escrow_dst`** - Creates a destination escrow for cross-chain transfers
- **`withdraw`** - Withdraws funds from escrow using the correct secret hash
- **`cancel`** - Cancels an escrow and returns funds to depositor after timelock expires
- **`recover`** - Recovers remaining order funds after recovery period expires

### Utility Functions

- **`validate_merkle_proof`** - Validates merkle tree proof for multi-fill orders

## Data Structures

- **`FusionPlusOrder`** - Main order structure containing deposit, timelock, and whitelist parameters
- **`Escrow`** - Individual escrow structure for hash-locked transfers
- **`Timelock`** - Timelock parameters for withdraw and cancel periods

## Events

- **`OrderCreatedEvent`** - Emitted when a new order is created
- **`EscrowCreatedEvent`** - Emitted when a source escrow is created
- **`EscrowDstCreatedEvent`** - Emitted when a destination escrow is created
