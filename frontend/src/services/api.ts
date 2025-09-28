// API service for backend communication
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
};

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Order management
  async createOrder(orderData: any): Promise<AxiosResponse> {
    return this.client.post('/api/v1/order', orderData);
  }

  async getOrder(orderId: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/order/${orderId}`);
  }

  async updateOrder(orderId: string, updates: any): Promise<AxiosResponse> {
    return this.client.patch(`/api/v1/order/${orderId}`, updates);
  }

  async getOrders(params?: any): Promise<AxiosResponse> {
    return this.client.get('/api/v1/order', { params });
  }

  // Swap operations
  async createSwap(swapData: any): Promise<AxiosResponse> {
    return this.client.post('/api/v1/swap/create', swapData);
  }

  async getSwap(swapId: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/swap/status/${swapId}`);
  }

  async processSwap(swapId: string): Promise<AxiosResponse> {
    return this.client.post(`/api/v1/swap/process/${swapId}`);
  }

  async cancelSwap(swapId: string): Promise<AxiosResponse> {
    return this.client.post(`/api/v1/swap/cancel/${swapId}`);
  }

  async redeemSwap(swapId: string, preimage: string): Promise<AxiosResponse> {
    return this.client.post('/api/v1/swap/redeem', { swapId, preimage });
  }

  async refundSwap(swapId: string): Promise<AxiosResponse> {
    return this.client.post('/api/v1/swap/refund', { swapId });
  }

  // Price data
  async getPrices(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/price');
  }

  async getTokenPrice(chain: string, tokenAddress: string, currency = 'usd'): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/price/${chain}/${tokenAddress}`, {
      params: { currency }
    });
  }

  async getMultipleTokenPrices(requests: any[]): Promise<AxiosResponse> {
    return this.client.post('/api/v1/price/batch', { requests });
  }

  async getTokenPriceHistory(tokenId: string, days = 7, currency = 'usd'): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/price/history/${tokenId}`, {
      params: { days, currency }
    });
  }

  async getTrendingTokens(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/price/trending');
  }

  async getMarketData(tokenId: string, currency = 'usd'): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/price/market/${tokenId}`, {
      params: { currency }
    });
  }

  // 1inch integration
  async getTokens(chain: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/tokens/${chain}`);
  }

  async getTokenInfo(chain: string, tokenAddress: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/tokens/${chain}/${tokenAddress}`);
  }

  async getQuote(chain: string, params: any): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/quote/${chain}`, { params });
  }

  async getSwapData(chain: string, params: any): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/swap/${chain}`, { params });
  }

  async getGasPrice(chain: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/gas-price/${chain}`);
  }

  async getProtocols(chain: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/protocols/${chain}`);
  }

  async getTokenPrice(chain: string, tokenAddress: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/price/${chain}`, {
      params: { tokenAddress }
    });
  }

  async getApprovalData(chain: string, tokenAddress: string, amount: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/approve/${chain}`, {
      params: { tokenAddress, amount }
    });
  }

  async getAllowance(chain: string, tokenAddress: string, walletAddress: string, spenderAddress: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/allowance/${chain}`, {
      params: { tokenAddress, walletAddress, spenderAddress }
    });
  }

  async validateSwap(chain: string, fromToken: string, toToken: string, amount: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/validate/${chain}`, {
      params: { fromToken, toToken, amount }
    });
  }

  async getOptimalRoute(chain: string, params: any): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/1inch/route/${chain}`, { params });
  }

  async getOneInchHealth(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/1inch/health');
  }

  // WebSocket management
  async getWebSocketStats(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/ws/stats');
  }

  async getWebSocketInfo(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/ws/info');
  }

  async getClientInfo(clientId: string): Promise<AxiosResponse> {
    return this.client.get(`/api/v1/ws/client/${clientId}`);
  }

  async broadcastMessage(message: string, data?: any): Promise<AxiosResponse> {
    return this.client.post('/api/v1/ws/broadcast', { message, data });
  }

  async broadcastToTopic(topic: string, data: any): Promise<AxiosResponse> {
    return this.client.post(`/api/v1/ws/broadcast/${topic}`, { data });
  }

  async sendToClient(clientId: string, type: string, data?: any): Promise<AxiosResponse> {
    return this.client.post(`/api/v1/ws/client/${clientId}/send`, { type, data });
  }

  // Health and status
  async getHealth(): Promise<AxiosResponse> {
    return this.client.get('/health');
  }

  async getStatus(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/status');
  }

  async getRelayerStatus(): Promise<AxiosResponse> {
    return this.client.get('/api/v1/relayer/status');
  }
}

export const apiService = new ApiService();
export default apiService;
