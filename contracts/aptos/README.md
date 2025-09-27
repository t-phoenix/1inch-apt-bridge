# 1inch-apt-bridge Aptos Contracts

Move smart contracts for cross-chain swaps between EVM chains and Aptos using HTLC (Hash Time-Locked Contracts).

## Overview

This module implements secure HTLC functionality on Aptos that mirrors the Solidity HTLC contract, enabling trustless cross-chain swaps with the following features:

- **Atomic fund transfers** during escrow creation
- **Safety deposit mechanism** to prevent resolver misconduct
- **Hashlock and timelock** security guarantees
- **Comprehensive event logging** for relayer monitoring
- **Admin functions** for emergency management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ethereum      │    │    Relayer      │    │     Aptos       │
│   (EVM Chain)   │◄──►│    Service      │◄──►│  (Move HTLC)    │
│   HTLCEscrow    │    │                 │    │   htlc.move     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Contract Features

### Core HTLC Functions

1. **`create_escrow`** - Creates a new HTLC escrow with atomic fund transfer
2. **`redeem`** - Redeems the swap using the correct preimage
3. **`refund`** - Refunds the swap after timelock expiry
4. **`claim_safety_deposit`** - Claims safety deposit when resolver fails

### Security Features

- **Atomic transfers**: Funds are transferred atomically during escrow creation
- **Safety deposits**: Resolver must deposit APT as collateral
- **Timelock validation**: Prevents too short or too long lock periods
- **Authorization checks**: Only authorized parties can refund/claim
- **Pausable functionality**: Emergency stop mechanism

### Admin Functions

- **`update_parameters`** - Update safety deposit and timelock settings
- **`pause`/`unpause`** - Emergency pause/unpause functionality

## Setup

### Prerequisites

1. **Aptos CLI**: Install the Aptos CLI tool
2. **Node.js**: For deployment scripts
3. **APT tokens**: For deployment and testing

### Installation

```bash
# Install dependencies
npm install

# Install Aptos CLI (if not already installed)
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

### Configuration

1. **Set up environment variables**:
```bash
# Add to your .env file
APTOS_PRIVATE_KEY=your_aptos_private_key_here
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
```

2. **Update Move.toml** with your module address:
```toml
[addresses]
oneinch_apt_bridge = "0xYOUR_ADDRESS"
```

## Development

### Compile Contracts

```bash
# Compile Move contracts
aptos move compile

# Or use npm script
npm run compile
```

### Run Tests

```bash
# Run all tests
aptos move test

# Or use npm script
npm run test
```

### Deploy Contracts

```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet
```

## Contract Interface

### Creating an Escrow

```move
public fun create_escrow(
    account: &signer,
    swap_id: String,
    maker: address,
    recipient: address,
    amount: u64,
    hashlock: vector<u8>,
    timelock: u64,
)
```

**Parameters:**
- `account`: Resolver's signer (must send safety deposit)
- `swap_id`: Unique identifier for the swap
- `maker`: Address of the user creating the swap
- `recipient`: Final recipient of funds
- `amount`: Amount of APT to swap (in octas)
- `hashlock`: 32-byte hash of the secret (keccak256(preimage))
- `timelock`: Unix timestamp when swap expires

### Redeeming a Swap

```move
public fun redeem(
    account: &signer,
    swap_id: String,
    preimage: vector<u8>,
)
```

**Parameters:**
- `account`: Redeemer's signer
- `swap_id`: Swap identifier
- `preimage`: Secret that hashes to the hashlock

### Refunding a Swap

```move
public fun refund(
    account: &signer,
    swap_id: String,
)
```

**Parameters:**
- `account`: Maker's or resolver's signer
- `swap_id`: Swap identifier

## Integration with Backend

The Aptos contract integrates with the backend relayer service through:

1. **Event monitoring**: Backend listens for contract events
2. **Transaction tracking**: All operations are logged for audit
3. **State synchronization**: Contract state is mirrored in database

### Key Events

- `EscrowCreatedEvent`: Emitted when escrow is created
- `RedeemedEvent`: Emitted when swap is redeemed
- `RefundedEvent`: Emitted when swap is refunded
- `SafetyDepositClaimedEvent`: Emitted when safety deposit is claimed

## Security Considerations

### Keccak256 Compatibility

The contract uses a keccak256 implementation that must be compatible with Ethereum's keccak256. In production, ensure:

1. Use a proper keccak256 library
2. Test hash compatibility between chains
3. Validate preimage verification logic

### Gas Management

- **Safety deposits** ensure resolver has skin in the game
- **Timelock validation** prevents indefinite locks
- **Atomic transfers** reduce gas costs and complexity

### Access Control

- **Admin functions** restricted to contract owner
- **Refund authorization** limited to maker and resolver
- **Safety deposit claims** restricted to maker

## Testing

The test suite covers:

- ✅ Contract initialization
- ✅ Escrow creation with various scenarios
- ✅ Successful redemption with correct preimage
- ✅ Refund after timelock expiry
- ✅ Safety deposit claiming
- ✅ Admin function access control
- ✅ Error handling and edge cases

Run tests:
```bash
aptos move test
```

## Deployment

### Testnet Deployment

1. **Get testnet APT**: Use the Aptos faucet
2. **Deploy contract**: Run deployment script
3. **Verify deployment**: Check on Aptos explorer
4. **Update configuration**: Set contract address in backend

### Mainnet Deployment

1. **Prepare mainnet APT**: Ensure sufficient balance
2. **Update configuration**: Set mainnet parameters
3. **Deploy contract**: Run mainnet deployment
4. **Verify and audit**: Thorough testing before production use

## Gas Optimization

The contract is optimized for gas efficiency:

- **Minimal storage operations**
- **Efficient event emission**
- **Atomic operations** to reduce transaction count
- **Batch operations** where possible

## Monitoring and Maintenance

### Event Monitoring

Monitor these events for operational health:

- Escrow creation frequency
- Redemption success rate
- Refund patterns
- Safety deposit claims

### Performance Metrics

Track key metrics:

- Average swap completion time
- Gas costs per operation
- Contract utilization
- Error rates

## Troubleshooting

### Common Issues

1. **Insufficient balance**: Ensure account has enough APT
2. **Invalid timelock**: Check timelock constraints
3. **Hash mismatch**: Verify keccak256 compatibility
4. **Authorization errors**: Check caller permissions

### Debug Tips

- Use Aptos explorer to trace transactions
- Check contract events for state changes
- Verify account balances and allowances
- Test with small amounts first

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Write tests** for new functionality
4. **Submit a pull request**

## License

MIT License - see LICENSE file for details.
