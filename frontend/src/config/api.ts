// API configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000'),
} as const;

export const WEBSOCKET_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws',
  reconnectInterval: parseInt(import.meta.env.VITE_WS_RECONNECT_INTERVAL || '5000'),
  maxReconnectAttempts: parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS || '5'),
  heartbeatInterval: parseInt(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL || '30000'),
} as const;

export const ONE_INCH_CONFIG = {
  apiUrl: import.meta.env.VITE_ONE_INCH_API_URL || 'https://api.1inch.io/v5.0',
  apiKey: import.meta.env.VITE_ONE_INCH_API_KEY || '',
} as const;

export const COINGECKO_CONFIG = {
  apiUrl: import.meta.env.VITE_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
  apiKey: import.meta.env.VITE_COINGECKO_API_KEY || '',
} as const;

export const SWAP_CONFIG = {
  defaultSlippage: parseFloat(import.meta.env.VITE_DEFAULT_SLIPPAGE || '0.5'),
  maxSlippage: parseFloat(import.meta.env.VITE_MAX_SLIPPAGE || '50'),
  minSlippage: parseFloat(import.meta.env.VITE_MIN_SLIPPAGE || '0.1'),
  defaultTimelock: parseInt(import.meta.env.VITE_DEFAULT_TIMELOCK || '3600'),
  minTimelock: parseInt(import.meta.env.VITE_MIN_TIMELOCK || '300'),
  maxTimelock: parseInt(import.meta.env.VITE_MAX_TIMELOCK || '86400'),
} as const;

export const UI_CONFIG = {
  theme: import.meta.env.VITE_THEME || 'dark',
  language: import.meta.env.VITE_LANGUAGE || 'en',
  currency: import.meta.env.VITE_CURRENCY || 'USD',
  refreshInterval: parseInt(import.meta.env.VITE_REFRESH_INTERVAL || '5000'),
  animationDuration: parseInt(import.meta.env.VITE_ANIMATION_DURATION || '300'),
} as const;

export const FEATURE_FLAGS = {
  enableTestnet: import.meta.env.VITE_ENABLE_TESTNET === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false',
  enablePriceUpdates: import.meta.env.VITE_ENABLE_PRICE_UPDATES !== 'false',
} as const;
