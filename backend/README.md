# 1inch-apt-bridge Backend

Backend relayer service for cross-chain swaps between EVM chains (Ethereum, Polygon) and Aptos using HTLC (Hash Time-Locked Contracts).

## Features

- **Cross-chain relayer**: Manages swap execution between EVM and Aptos chains
- **HTLC escrow management**: Handles hashlock and timelock logic
- **Event monitoring**: Listens for on-chain events and triggers appropriate actions
- **Order management**: Tracks swap orders and their status
- **REST API**: Provides endpoints for frontend integration

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ethereum      │    │    Relayer      │    │     Aptos       │
│   (EVM Chain)   │◄──►│    Service      │◄──►│  (Non-EVM)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

4. Start the production server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Swap Operations
- `POST /api/v1/swap/create` - Create a new cross-chain swap
- `GET /api/v1/swap/status/:orderId` - Get swap status

### Order Management
- `GET /api/v1/order/:orderId` - Get order details
- `PATCH /api/v1/order/:orderId/status` - Update order status

## Environment Variables

See `.env.example` for required environment variables.

## Development

- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Security

- All sensitive operations are logged
- Input validation using Joi
- Rate limiting on API endpoints
- Secure error handling
