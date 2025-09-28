// Price service for token prices and market data
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { oneInchService } from './oneInchService.js';

class PriceService {
  constructor() {
    this.coingeckoBaseURL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    this.client = axios.create({
      baseURL: this.coingeckoBaseURL,
      timeout: 10000,
      headers: {
        'x-cg-demo-api-key': this.coingeckoApiKey,
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Price API request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Price API request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Price API response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Price API response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Get cached price or fetch new one
  async getCachedPrice(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Get token price from 1inch
  async getTokenPriceFrom1inch(chainName, tokenAddress) {
    try {
      const price = await oneInchService.getTokenPrice(chainName, tokenAddress);
      return {
        source: '1inch',
        price: parseFloat(price),
        currency: 'USD',
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Failed to get price from 1inch for ${tokenAddress} on ${chainName}:`, error);
      throw error;
    }
  }

  // Get token price from CoinGecko
  async getTokenPriceFromCoinGecko(tokenId, currency = 'usd') {
    try {
      const response = await this.client.get('/simple/price', {
        params: {
          ids: tokenId,
          vs_currencies: currency,
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        }
      });

      const data = response.data[tokenId];
      if (!data) {
        throw new Error(`Token ${tokenId} not found on CoinGecko`);
      }

      return {
        source: 'coingecko',
        price: data[currency],
        currency: currency.toUpperCase(),
        change24h: data[`${currency}_24h_change`],
        volume24h: data[`${currency}_24h_vol`],
        marketCap: data[`${currency}_market_cap`],
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Failed to get price from CoinGecko for ${tokenId}:`, error);
      throw error;
    }
  }

  // Get multiple token prices from CoinGecko
  async getMultipleTokenPricesFromCoinGecko(tokenIds, currency = 'usd') {
    try {
      const response = await this.client.get('/simple/price', {
        params: {
          ids: tokenIds.join(','),
          vs_currencies: currency,
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        }
      });

      const result = {};
      for (const [tokenId, data] of Object.entries(response.data)) {
        result[tokenId] = {
          source: 'coingecko',
          price: data[currency],
          currency: currency.toUpperCase(),
          change24h: data[`${currency}_24h_change`],
          volume24h: data[`${currency}_24h_vol`],
          marketCap: data[`${currency}_market_cap`],
          timestamp: Date.now()
        };
      }

      return result;
    } catch (error) {
      logger.error(`Failed to get multiple prices from CoinGecko for ${tokenIds}:`, error);
      throw error;
    }
  }

  // Get token price with fallback sources
  async getTokenPrice(chainName, tokenAddress, currency = 'usd') {
    const cacheKey = `price-${chainName}-${tokenAddress}-${currency}`;
    
    return this.getCachedPrice(cacheKey, async () => {
      // Try 1inch first for EVM chains
      if (['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism'].includes(chainName.toLowerCase())) {
        try {
          return await this.getTokenPriceFrom1inch(chainName, tokenAddress);
        } catch (error) {
          logger.warn(`1inch price failed for ${tokenAddress} on ${chainName}, trying CoinGecko`);
        }
      }

      // Fallback to CoinGecko
      try {
        const tokenId = this.getCoinGeckoTokenId(chainName, tokenAddress);
        return await this.getTokenPriceFromCoinGecko(tokenId, currency);
      } catch (error) {
        logger.error(`All price sources failed for ${tokenAddress} on ${chainName}:`, error);
        throw new Error(`Unable to fetch price for ${tokenAddress} on ${chainName}`);
      }
    });
  }

  // Get multiple token prices
  async getMultipleTokenPrices(requests) {
    const results = {};
    const promises = [];

    for (const request of requests) {
      const { chainName, tokenAddress, currency = 'usd' } = request;
      const promise = this.getTokenPrice(chainName, tokenAddress, currency)
        .then(price => {
          results[`${chainName}-${tokenAddress}`] = price;
        })
        .catch(error => {
          logger.error(`Failed to get price for ${tokenAddress} on ${chainName}:`, error);
          results[`${chainName}-${tokenAddress}`] = {
            error: error.message,
            source: 'error',
            timestamp: Date.now()
          };
        });
      
      promises.push(promise);
    }

    await Promise.all(promises);
    return results;
  }

  // Get token price history
  async getTokenPriceHistory(tokenId, days = 7, currency = 'usd') {
    try {
      const response = await this.client.get(`/coins/${tokenId}/market_chart`, {
        params: {
          vs_currency: currency,
          days: days,
          interval: days <= 1 ? 'hourly' : 'daily'
        }
      });

      return {
        source: 'coingecko',
        tokenId,
        currency: currency.toUpperCase(),
        prices: response.data.prices,
        marketCaps: response.data.market_caps,
        totalVolumes: response.data.total_volumes,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Failed to get price history for ${tokenId}:`, error);
      throw error;
    }
  }

  // Get trending tokens
  async getTrendingTokens() {
    try {
      const response = await this.client.get('/search/trending');
      
      return {
        source: 'coingecko',
        trending: response.data.coins,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Failed to get trending tokens:', error);
      throw error;
    }
  }

  // Get market data for a token
  async getMarketData(tokenId, currency = 'usd') {
    try {
      const response = await this.client.get(`/coins/${tokenId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });

      const marketData = response.data.market_data;
      return {
        source: 'coingecko',
        tokenId,
        name: response.data.name,
        symbol: response.data.symbol,
        currentPrice: marketData.current_price[currency],
        currency: currency.toUpperCase(),
        marketCap: marketData.market_cap[currency],
        totalVolume: marketData.total_volume[currency],
        high24h: marketData.high_24h[currency],
        low24h: marketData.low_24h[currency],
        priceChange24h: marketData.price_change_24h,
        priceChangePercentage24h: marketData.price_change_percentage_24h,
        marketCapChange24h: marketData.market_cap_change_24h,
        marketCapChangePercentage24h: marketData.market_cap_change_percentage_24h,
        circulatingSupply: marketData.circulating_supply,
        totalSupply: marketData.total_supply,
        maxSupply: marketData.max_supply,
        ath: marketData.ath[currency],
        athChangePercentage: marketData.ath_change_percentage[currency],
        athDate: marketData.ath_date[currency],
        atl: marketData.atl[currency],
        atlChangePercentage: marketData.atl_change_percentage[currency],
        atlDate: marketData.atl_date[currency],
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Failed to get market data for ${tokenId}:`, error);
      throw error;
    }
  }

  // Map token addresses to CoinGecko token IDs
  getCoinGeckoTokenId(chainName, tokenAddress) {
    const tokenMap = {
      ethereum: {
        '0x0000000000000000000000000000000000000000': 'ethereum',
        '0xA0b86a33E6441b8C4C8C0d4B0c62e3B0f1f0e1d0': 'usd-coin', // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'tether', // USDT
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'dai', // DAI
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'wrapped-bitcoin', // WBTC
      },
      polygon: {
        '0x0000000000000000000000000000000000000000': 'matic-network',
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'usd-coin', // USDC
        '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': 'tether', // USDT
        '0x8f3Cf7ad23D3eDb4Af844730C685F5a7C34F9aA1': 'dai', // DAI
      },
      aptos: {
        '0x1::aptos_coin::AptosCoin': 'aptos',
        '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T': 'usd-coin', // USDC
      }
    };

    const chainMap = tokenMap[chainName.toLowerCase()];
    if (!chainMap) {
      throw new Error(`Unsupported chain for CoinGecko mapping: ${chainName}`);
    }

    const tokenId = chainMap[tokenAddress.toLowerCase()];
    if (!tokenId) {
      throw new Error(`Token ${tokenAddress} not mapped for CoinGecko on ${chainName}`);
    }

    return tokenId;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    logger.info('Price cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }
}

export const priceService = new PriceService();
export default priceService;
