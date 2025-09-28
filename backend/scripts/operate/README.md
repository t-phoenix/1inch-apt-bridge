# Backend Operation Scripts

This directory contains JavaScript scripts to operate the 1inch-apt-bridge backend. Each script corresponds to one route in the backend API.

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **Backend Running**: Make sure the backend server is running on `http://localhost:3001` (or set `BACKEND_URL` environment variable)
3. **Dependencies**: Install required packages with `npm install`

## Installation

```bash
cd backend/scripts/operate
npm install
```

## Available Scripts

### 1. Health Check (`health-check.js`)
Checks the health status of the backend and its services.

```bash
# Basic health check
node health-check.js

# Or using npm script
npm run health
```

**Endpoint**: `GET /health`

### 2. Root Endpoint (`root-endpoint.js`)
Tests the root endpoint to verify API availability.

```bash
# Check root endpoint
node root-endpoint.js

# Or using npm script
npm run root
```

**Endpoint**: `GET /`

### 3. Swap Creation (`swap-create.js`)
Creates a new cross-chain swap order.

```bash
# Create swap with default parameters
node swap-create.js

# Create swap with custom parameters
node swap-create.js --makerAddress 0x123... --takerAddress 0x456... --amount 2000000000000000000

# Or using npm script
npm run swap:create
```

**Endpoint**: `POST /api/v1/swap/create`

**Parameters** (can be set via command line or environment variables):
- `makerAddress`: Address of the maker
- `takerAddress`: Address of the taker
- `fromChain`: Source blockchain (e.g., 'ethereum')
- `toChain`: Destination blockchain (e.g., 'aptos')
- `fromToken`: Source token address
- `toToken`: Destination token address
- `amount`: Amount to swap (in wei for Ethereum)
- `timelock`: Time lock duration in seconds

### 4. Swap Status (`swap-status.js`)
Checks the status of a swap order.

```bash
# Check swap status
node swap-status.js <orderId>

# Example
node swap-status.js 123e4567-e89b-12d3-a456-426614174000

# Or using npm script
npm run swap:status <orderId>
```

**Endpoint**: `GET /api/v1/swap/status/:orderId`

### 5. Order Retrieval (`order-get.js`)
Retrieves detailed information about an order.

```bash
# Get order details
node order-get.js <orderId>

# Example
node order-get.js 123e4567-e89b-12d3-a456-426614174000

# Or using npm script
npm run order:get <orderId>
```

**Endpoint**: `GET /api/v1/order/:orderId`

### 6. Order Update (`order-update.js`)
Updates the status of an order (typically used by relayer).

```bash
# Update order status
node order-update.js <orderId> <status> [transactionHash] [blockNumber]

# Examples
node order-update.js 123e4567-e89b-12d3-a456-426614174000 completed
node order-update.js 123e4567-e89b-12d3-a456-426614174000 completed 0xabc123... 12345

# Or using npm script
npm run order:update <orderId> <status> [transactionHash] [blockNumber]
```

**Endpoint**: `PATCH /api/v1/order/:orderId/status`

**Valid Statuses**: `pending`, `processing`, `completed`, `failed`, `cancelled`

## Environment Variables

You can set these environment variables to customize the scripts:

```bash
# Backend URL (default: http://localhost:3001)
export BACKEND_URL=http://localhost:3001

# Default swap parameters
export MAKER_ADDRESS=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
export TAKER_ADDRESS=0x8ba1f109551bD432803012645Hac136c
export FROM_CHAIN=ethereum
export TO_CHAIN=aptos
export FROM_TOKEN=0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C4
export TO_TOKEN=0x1::aptos_coin::AptosCoin
export AMOUNT=1000000000000000000
export TIMELOCK=3600
```

## Usage Examples

### Complete Swap Workflow

1. **Check if backend is running**:
   ```bash
   node health-check.js
   ```

2. **Create a swap order**:
   ```bash
   node swap-create.js --amount 1000000000000000000 --timelock 3600
   ```

3. **Check swap status**:
   ```bash
   node swap-status.js <orderId>
   ```

4. **Get detailed order information**:
   ```bash
   node order-get.js <orderId>
   ```

5. **Update order status** (if you're the relayer):
   ```bash
   node order-update.js <orderId> completed 0xabc123... 12345
   ```

### Testing All Endpoints

```bash
# Run all basic tests
npm run test:all
```

## Error Handling

All scripts include comprehensive error handling and will:
- Display clear error messages
- Show HTTP status codes and response data
- Provide helpful suggestions for common issues
- Exit with appropriate status codes (0 for success, 1 for failure)

## Integration

These scripts can be easily integrated into:
- CI/CD pipelines
- Monitoring systems
- Automated testing
- Development workflows
- Production operations

## Notes

- All scripts use ES modules (`import`/`export`)
- Scripts are designed to be both interactive and scriptable
- Each script can be run independently
- Scripts include helpful usage information when run without proper arguments
- All scripts support both command-line arguments and environment variables