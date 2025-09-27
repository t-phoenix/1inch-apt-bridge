# NeonDB Setup Guide

This guide explains how to set up NeonDB for the 1inch-apt-bridge backend.

## What is NeonDB?

NeonDB is a serverless PostgreSQL database that's perfect for hackathons and production applications. It provides:
- Automatic scaling
- Serverless architecture
- Built-in connection pooling
- Global distribution

## Setup Steps

### 1. Create a NeonDB Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

### 2. Get Your Database URL

1. In your NeonDB dashboard, go to your project
2. Click on "Connection Details"
3. Copy the connection string (it looks like: `postgresql://username:password@host/database?sslmode=require`)

### 3. Set Environment Variables

Add the following to your `.env` file:

```bash
# NeonDB Configuration
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NEON_DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Alternative: You can also use individual components
NEON_HOST=your-neon-host
NEON_DATABASE=your-database-name
NEON_USERNAME=your-username
NEON_PASSWORD=your-password
```

### 4. Run Database Migration

```bash
npm run migrate
```

This will create all the necessary tables in your NeonDB instance.

## Environment Variables

The backend supports these database-related environment variables:

- `DATABASE_URL` - Full PostgreSQL connection string
- `NEON_DATABASE_URL` - NeonDB-specific connection string
- `NODE_ENV` - Set to 'development' for verbose logging

## Database Schema

The backend creates the following tables:

1. **orders** - Cross-chain swap orders
2. **escrows** - HTLC escrow contracts
3. **transactions** - On-chain transaction records

## Troubleshooting

### Connection Issues

If you're having connection issues:

1. Check that your `DATABASE_URL` is correct
2. Ensure SSL is enabled (`sslmode=require`)
3. Verify your NeonDB project is active

### Migration Issues

If migrations fail:

1. Check database permissions
2. Ensure the database exists
3. Verify connection string format

### Performance

For better performance with NeonDB:

1. Use connection pooling (already configured)
2. Enable query logging in development
3. Monitor connection usage in NeonDB dashboard

## Free Tier Limits

NeonDB free tier includes:
- 3GB storage
- 10GB transfer
- 1,000 hours compute time per month

This should be sufficient for hackathon development and testing.

