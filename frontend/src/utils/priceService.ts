// Backend proxy configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface TokenPrice {
  symbol: string;
  address: string;
  price: number; // Price in USD
  timestamp: number;
}

export interface BackendResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

/**
 * Fetch token prices from backend proxy (which calls 1inch API)
 */
export async function fetchTokenPrices(
  chainId: number = 137,
  tokens: string[] = ['POL']
): Promise<TokenPrice[]> {
  try {
    const tokensParam = tokens.join(',');
    const url = `${BACKEND_URL}/api/prices?chainId=${chainId}&tokens=${tokensParam}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BackendResponse<TokenPrice[]> = await response.json();
    
    if (!result.success && result.error) {
      console.warn('Backend returned error:', result.error);
    }

    return result.data || getMockPrices(tokens);

  } catch (error) {
    console.error('Error fetching token prices from backend:', error);
    return getMockPrices(tokens);
  }
}

/**
 * Fetch specific token prices for POL and APT with exchange rate
 */
export async function fetchPOLandAPTPrices(): Promise<{
  polPrice: number;
  aptPrice: number;
  exchangeRate: string;
}> {
  try {
    const url = `${BACKEND_URL}/api/exchange-rate`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BackendResponse<{
      polPrice: number;
      aptPrice: number;
      exchangeRate: string;
      formattedRate: string;
    }> = await response.json();

    if (!result.success && result.error) {
      console.warn('Backend returned error:', result.error);
    }

    const data = result.data;
    
    return {
      polPrice: data.polPrice,
      aptPrice: data.aptPrice,
      exchangeRate: data.formattedRate,
    };

  } catch (error) {
    console.error('Error fetching POL/APT prices from backend:', error);
    return {
      polPrice: 0.4024,
      aptPrice: 4024.57,
      exchangeRate: "1 POL = 4024.57 APT ~$4022.3",
    };
  }
}

/**
 * Fallback mock prices for development
 */
function getMockPrices(tokens: string[]): TokenPrice[] {
  const mockPrices: { [key: string]: number } = {
    POL: 0.4024,
    MATIC: 0.4018,
    WMATIC: 0.4018,
    APT: 4024.57,
  };

  return tokens.map(token => ({
    symbol: token.toUpperCase(),
    address: 'mock',
    price: mockPrices[token.toUpperCase()] || 1.0,
    timestamp: Date.now(),
  }));
}