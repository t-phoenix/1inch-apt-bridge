// 1inch API integration service
import axios from 'axios';
import { logger } from '../utils/logger.js';

class OneInchService {
  constructor() {
    this.baseURL = process.env.ONEINCH_API_URL || 'https://api.1inch.io/v6.0';
    this.apiKey = process.env.ONEINCH_API_KEY || '';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.supportedChains = {
      ethereum: 1,
      polygon: 137,
      bsc: 56,
      avalanche: 43114,
      arbitrum: 42161,
      optimism: 10,
    };

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`1inch API request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('1inch API request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`1inch API response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('1inch API response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  getChainId(chainName) {
    const chainId = this.supportedChains[chainName.toLowerCase()];
    if (!chainId) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }
    return chainId;
  }

  // Get supported tokens for a chain
  async getTokens(chainName) {
    try {
      const chainId = this.getChainId(chainName);
      const response = await this.client.get(`/tokens/${chainId}`);
      
      logger.info(`Retrieved ${Object.keys(response.data.tokens).length} tokens for ${chainName}`);
      return response.data.tokens;
    } catch (error) {
      logger.error(`Failed to get tokens for ${chainName}:`, error);
      throw new Error(`Failed to fetch tokens: ${error.message}`);
    }
  }

  // Get token information
  async getTokenInfo(chainName, tokenAddress) {
    try {
      const chainId = this.getChainId(chainName);
      const response = await this.client.get(`/tokens/${chainId}/${tokenAddress}`);
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get token info for ${tokenAddress} on ${chainName}:`, error);
      throw new Error(`Failed to fetch token info: ${error.message}`);
    }
  }

  // Get quote for token swap
  async getQuote(chainName, fromToken, toToken, amount, options = {}) {
    try {
      const chainId = this.getChainId(chainName);
      const {
        slippage = 0.5,
        fee = 0,
        gasPrice = null,
        complexityLevel = 'fast',
        connectorTokens = [],
        gasLimit = null,
        mainRouteParts = 10,
        parts = 50,
      } = options;

      const params = {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount.toString(),
        slippage: slippage.toString(),
        fee: fee.toString(),
        complexityLevel,
        connectorTokens: connectorTokens.join(','),
        mainRouteParts: mainRouteParts.toString(),
        parts: parts.toString(),
      };

      if (gasPrice) {
        params.gasPrice = gasPrice.toString();
      }

      if (gasLimit) {
        params.gasLimit = gasLimit.toString();
      }

      const response = await this.client.get(`/quote/${chainId}`, { params });
      
      logger.info(`Quote retrieved for ${amount} ${fromToken} → ${toToken} on ${chainName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get quote for ${fromToken} → ${toToken} on ${chainName}:`, error);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  // Get swap data for execution
  async getSwapData(chainName, fromToken, toToken, amount, fromAddress, options = {}) {
    try {
      const chainId = this.getChainId(chainName);
      const {
        slippage = 0.5,
        fee = 0,
        gasPrice = null,
        complexityLevel = 'fast',
        connectorTokens = [],
        gasLimit = null,
        mainRouteParts = 10,
        parts = 50,
        referrer = null,
        allowPartialFill = false,
        disableEstimate = false,
        permit = null,
        burnChi = false,
        allowSwap = true,
        allowBurn = false,
      } = options;

      const params = {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount.toString(),
        fromAddress,
        slippage: slippage.toString(),
        fee: fee.toString(),
        complexityLevel,
        connectorTokens: connectorTokens.join(','),
        mainRouteParts: mainRouteParts.toString(),
        parts: parts.toString(),
        allowPartialFill: allowPartialFill.toString(),
        disableEstimate: disableEstimate.toString(),
        burnChi: burnChi.toString(),
        allowSwap: allowSwap.toString(),
        allowBurn: allowBurn.toString(),
      };

      if (gasPrice) {
        params.gasPrice = gasPrice.toString();
      }

      if (gasLimit) {
        params.gasLimit = gasLimit.toString();
      }

      if (referrer) {
        params.referrer = referrer;
      }

      if (permit) {
        params.permit = permit;
      }

      const response = await this.client.get(`/swap/${chainId}`, { params });
      
      logger.info(`Swap data retrieved for ${amount} ${fromToken} → ${toToken} on ${chainName}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get swap data for ${fromToken} → ${toToken} on ${chainName}:`, error);
      throw new Error(`Failed to get swap data: ${error.message}`);
    }
  }

  // Get gas price for a chain
  async getGasPrice(chainName) {
    try {
      const chainId = this.getChainId(chainName);
      const response = await this.client.get(`/gas-price/${chainId}`);
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get gas price for ${chainName}:`, error);
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  // Get protocol images
  async getProtocolImages() {
    try {
      const response = await this.client.get('/protocols/images');
      return response.data;
    } catch (error) {
      logger.error('Failed to get protocol images:', error);
      throw new Error(`Failed to get protocol images: ${error.message}`);
    }
  }

  // Get supported protocols for a chain
  async getProtocols(chainName) {
    try {
      const chainId = this.getChainId(chainName);
      const response = await this.client.get(`/protocols/${chainId}`);
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get protocols for ${chainName}:`, error);
      throw new Error(`Failed to get protocols: ${error.message}`);
    }
  }

  // Get health status
  async getHealthStatus() {
    try {
      const response = await this.client.get('/healthcheck');
      return response.data;
    } catch (error) {
      logger.error('Failed to get 1inch health status:', error);
      throw new Error(`Failed to get health status: ${error.message}`);
    }
  }

  // Get approval data for token spending
  async getApprovalData(chainName, tokenAddress, amount) {
    try {
      const chainId = this.getChainId(chainName);
      const response = await this.client.get(`/approve/calldata/${chainId}`, {
        params: {
          tokenAddress,
          amount: amount.toString(),
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get approval data for ${tokenAddress} on ${chainName}:`, error);
      throw new Error(`Failed to get approval data: ${error.message}`);
    }
  }

  // Get allowance for token spending
  async getAllowance(chainName, tokenAddress, walletAddress, spenderAddress) {
    try {
      const chainId = this.getChainId(chainName);
      const response = await this.client.get(`/approve/allowance/${chainId}`, {
        params: {
          tokenAddress,
          walletAddress,
          spenderAddress,
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get allowance for ${tokenAddress} on ${chainName}:`, error);
      throw new Error(`Failed to get allowance: ${error.message}`);
    }
  }

  // Get token price in USD
  async getTokenPrice(chainName, tokenAddress) {
    try {
      const chainId = this.getChainId(chainName);
      const response = await this.client.get(`/price/${chainId}`, {
        params: {
          tokenAddress,
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get token price for ${tokenAddress} on ${chainName}:`, error);
      throw new Error(`Failed to get token price: ${error.message}`);
    }
  }

  // Get multiple token prices
  async getTokenPrices(chainName, tokenAddresses) {
    try {
      const chainId = this.getChainId(chainName);
      const response = await this.client.get(`/price/${chainId}`, {
        params: {
          tokenAddresses: tokenAddresses.join(','),
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get token prices for ${tokenAddresses} on ${chainName}:`, error);
      throw new Error(`Failed to get token prices: ${error.message}`);
    }
  }

  // Validate if a swap is possible
  async validateSwap(chainName, fromToken, toToken, amount) {
    try {
      const quote = await this.getQuote(chainName, fromToken, toToken, amount);
      return {
        isValid: true,
        quote,
        message: 'Swap is valid'
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        message: 'Swap is not valid'
      };
    }
  }

  // Get optimal swap route
  async getOptimalRoute(chainName, fromToken, toToken, amount, options = {}) {
    try {
      const quote = await this.getQuote(chainName, fromToken, toToken, amount, options);
      const swapData = await this.getSwapData(chainName, fromToken, toToken, amount, options.fromAddress, options);
      
      return {
        quote,
        swapData,
        route: swapData.tx,
        estimatedGas: swapData.tx.gas,
        estimatedGasPrice: swapData.tx.gasPrice,
        estimatedGasLimit: swapData.tx.gasLimit,
      };
    } catch (error) {
      logger.error(`Failed to get optimal route for ${fromToken} → ${toToken} on ${chainName}:`, error);
      throw new Error(`Failed to get optimal route: ${error.message}`);
    }
  }
}

export const oneInchService = new OneInchService();
export default oneInchService;
