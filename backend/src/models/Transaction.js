import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

export const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  
  // Associated entities
  orderId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  escrowId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'escrows',
      key: 'id'
    }
  },
  
  // Transaction details
  chain: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Blockchain where transaction occurred'
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Transaction hash'
  },
  blockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Block number where transaction was mined'
  },
  
  // Transaction type
  type: {
    type: DataTypes.ENUM(
      'escrow_creation',  // HTLC escrow contract creation
      'escrow_funding',   // Funds deposited into escrow
      'escrow_claim',     // Funds claimed from escrow
      'escrow_refund',    // Funds refunded from escrow
      'token_transfer',   // Direct token transfer
      'contract_call'     // Other contract interaction
    ),
    allowNull: false
  },
  
  // Transaction status
  status: {
    type: DataTypes.ENUM(
      'pending',      // Transaction submitted
      'confirmed',    // Transaction confirmed
      'failed',       // Transaction failed
      'reverted'      // Transaction reverted
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  
  // Gas information
  gasUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Gas used by transaction'
  },
  gasPrice: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Gas price (as string for big numbers)'
  },
  
  // Error information
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if transaction failed'
  },
  
  // Timestamps
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    {
      fields: ['orderId']
    },
    {
      fields: ['escrowId']
    },
    {
      fields: ['chain']
    },
    {
      fields: ['txHash']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['blockNumber']
    }
  ]
});

