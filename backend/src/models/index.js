// Export all models for easy importing
export { Order } from './Order.js';
export { Escrow } from './Escrow.js';
export { Transaction } from './Transaction.js';

// Define model associations
export function setupModelAssociations() {
  const { Order } = await import('./Order.js');
  const { Escrow } = await import('./Escrow.js');
  const { Transaction } = await import('./Transaction.js');

  // Order -> Escrow (one-to-many)
  Order.hasMany(Escrow, {
    foreignKey: 'orderId',
    as: 'escrows'
  });
  Escrow.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
  });

  // Order -> Transaction (one-to-many)
  Order.hasMany(Transaction, {
    foreignKey: 'orderId',
    as: 'transactions'
  });
  Transaction.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
  });

  // Escrow -> Transaction (one-to-many)
  Escrow.hasMany(Transaction, {
    foreignKey: 'escrowId',
    as: 'transactions'
  });
  Transaction.belongsTo(Escrow, {
    foreignKey: 'escrowId',
    as: 'escrow'
  });
}

