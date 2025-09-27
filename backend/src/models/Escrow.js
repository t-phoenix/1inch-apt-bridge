import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

export const Escrow = sequelize.define('Escrow', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  
  // Associated order
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  
  // Chain information
  chain: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Chain where escrow is deployed (ethereum, polygon, aptos)'
  },
  
  // Escrow contract details
  contractAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Address of the HTLC escrow contract'
  },
  
  // HTLC parameters
  hash: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'HTLC hashlock'
  },
  timelock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'HTLC timelock (Unix timestamp)'
  },
  
  // Escrow state
  status: {
    type: DataTypes.ENUM(
      'created',      // Escrow contract deployed
      'funded',       // Funds deposited into escrow
      'claimed',      // Funds claimed with secret
      'refunded',     // Funds refunded after timelock
      'expired'       // Timelock expired
    ),
    defaultValue: 'created',
    allowNull: false
  },
  
  // Transaction tracking
  creationTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Transaction hash that created the escrow'
  },
  fundingTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Transaction hash that funded the escrow'
  },
  claimTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Transaction hash that claimed the funds'
  },
  refundTxHash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Transaction hash that refunded the funds'
  },
  
  // Block numbers for event tracking
  creationBlockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fundingBlockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  claimBlockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  refundBlockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
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
  tableName: 'escrows',
  timestamps: true,
  indexes: [
    {
      fields: ['orderId']
    },
    {
      fields: ['chain']
    },
    {
      fields: ['status']
    },
    {
      fields: ['contractAddress']
    }
  ]
});

