import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';

/**
 * 🔥 REAL PRICE TESTING COMPONENT
 * Tests both Aptos and Polygon price accuracy
 */
export function PriceTestPanel() {
  const [aptosPrice, setAptosPrice] = useState<any>(null);
  const [polygonPrices, setPolygonPrices] = useState<any>(null);
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServerHealth = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      setServerHealth(data);
    } catch (err) {
      console.warn('Health check failed:', err);
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clear-cache', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('✅ Cache cleared:', data);
      await fetchServerHealth(); // Refresh health info
    } catch (err) {
      console.error('❌ Failed to clear cache:', err);
    }
  };

  const fetchRealAptosPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing real Aptos prices with caching...');
      
      const response = await fetch('http://localhost:3001/api/prices?chainId=99999&tokens=APT,USDC');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔥 Aptos price response:', data);
      
      setAptosPrice(data);
      await fetchServerHealth(); // Update health info
      
    } catch (err: any) {
      console.error('❌ Aptos price test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolygonPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing Polygon prices...');
      
      const response = await fetch('http://localhost:3001/api/prices?chainId=137&tokens=POL,USDC');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔷 Polygon price response:', data);
      
      setPolygonPrices(data);
      
    } catch (err: any) {
      console.error('❌ Polygon price test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch server health on mount
  useEffect(() => {
    fetchServerHealth();
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Real Price Testing
          <Badge variant="outline">Live API</Badge>
        </CardTitle>
        <CardDescription>
          Test real-time price feeds from CoinGecko (Aptos) and 1inch (Polygon)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button 
              onClick={fetchRealAptosPrices} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? '🔄' : '🅰️'} Test Aptos Prices
            </Button>
            
            <Button 
              onClick={fetchPolygonPrices} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? '🔄' : '🔷'} Test Polygon Prices
            </Button>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={fetchServerHealth} 
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              📊 Check Server Health
            </Button>
            
            <Button 
              onClick={clearCache} 
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              🧹 Clear Cache
            </Button>
          </div>
        </div>

        {/* Server Health Display */}
        {serverHealth && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">🖥️ Server Status</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Status: <Badge variant="secondary">{serverHealth.status}</Badge></div>
              <div>Cache Size: <span className="font-mono">{serverHealth.cacheSize}</span></div>
              <div className="col-span-2">
                Last API Call: <span className="font-mono text-xs">
                  {serverHealth.lastCoinGeckoCall !== 'never' ? 
                    new Date(serverHealth.lastCoinGeckoCall).toLocaleTimeString() : 
                    'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">❌ {error}</p>
          </div>
        )}

        {/* Aptos Results */}
        {aptosPrice && (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              🅰️ Aptos Chain Results
              <Badge variant="secondary">{aptosPrice.success ? '✅ Success' : '❌ Failed'}</Badge>
            </h3>
            
            <div className="grid gap-3">
              {aptosPrice.data && aptosPrice.data.map((token: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      Source: {token.source} • {new Date(token.timestamp).toLocaleTimeString()}
                      {token.source.includes('coingecko') && <Badge variant="outline" className="ml-2 text-xs">✅ Live API</Badge>}
                      {token.source.includes('fallback') && <Badge variant="secondary" className="ml-2 text-xs">📦 Cached</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg">${token.price.toFixed(4)}</div>
                    {token.change24h && (
                      <div className={`text-sm ${token.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polygon Results */}
        {polygonPrices && (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              🔷 Polygon Chain Results
              <Badge variant="secondary">{polygonPrices.success ? '✅ Success' : '❌ Failed'}</Badge>
            </h3>
            
            <div className="grid gap-3">
              {polygonPrices.data && polygonPrices.data.map((token: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      Address: {token.address.slice(0, 10)}... • {new Date(token.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg">${token.price.toFixed(6)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            🔥 <strong>Rate Limited & Cached Price Sources:</strong><br/>
            • Aptos (APT): CoinGecko API (30s cache, 1s rate limit)<br/>
            • Polygon (POL/MATIC): 1inch API with real market data<br/>
            • Smart caching prevents API exhaustion and 429 errors
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PriceTestPanel;