import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

export const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  
  // Order participants
  makerAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Address of the user creating the swap order'
  },
  takerAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Address of the user fulfilling the swap order'
  },
  
  // Chain information
  fromChain: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Source chain (ethereum, polygon, aptos)'
  },
  toChain: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Destination chain (ethereum, polygon, aptos)'
  },
  
  // Token information
  fromToken: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Source token address or identifier'
  },
  toToken: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Destination token address or identifier'
  },
  amount: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Swap amount (as string to handle big numbers)'
  },
  
  // HTLC parameters
  hash: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'HTLC hashlock (keccak256/sha256 of secret)'
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'HTLC secret (preimage)'
  },
  timelock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'HTLC timelock (Unix timestamp)'
  },
  
  // Order status
  status: {
    type: DataTypes.ENUM(
      'pending',      // Order created, waiting for taker
      'matched',      // Taker found, escrows being created
      'escrowed',     // Both escrows created
      'claimed',      // Secret revealed, funds claimed
      'refunded',     // Timelock expired, funds refunded
      'failed',       // Order failed
      'cancelled'     // Order cancelled
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  
  // Transaction hashes
  fromChainTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Transaction hash on source chain'
  },
  toChainTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Transaction hash on destination chain'
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
  tableName: 'orders',
  timestamps: true,
  indexes: [
    {
      fields: ['makerAddress']
    },
    {
      fields: ['status']
    },
    {
      fields: ['fromChain', 'toChain']
    },
    {
      fields: ['createdAt']
    }
  ]
});

