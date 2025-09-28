// Custom hook for WebSocket management
import { useEffect, useRef, useState } from 'react';
import { wsService, WebSocketEventHandlers } from '../services/websocket';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnClose?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnectOnClose = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState(WebSocket.CLOSED);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const eventHandlersRef = useRef<WebSocketEventHandlers>({});

  useEffect(() => {
    if (autoConnect) {
      wsService.connect();
    }

    // Set up event handlers
    const handlers: WebSocketEventHandlers = {
      onOpen: () => {
        setIsConnected(true);
        setConnectionState(WebSocket.OPEN);
        setError(null);
        eventHandlersRef.current.onOpen?.();
      },
      onClose: () => {
        setIsConnected(false);
        setConnectionState(WebSocket.CLOSED);
        eventHandlersRef.current.onClose?.();
      },
      onError: (error) => {
        setError('WebSocket connection error');
        eventHandlersRef.current.onError?.(error);
      },
      onMessage: (message) => {
        setLastMessage(message);
        eventHandlersRef.current.onMessage?.(message);
      },
      onOrdersUpdate: (data) => {
        eventHandlersRef.current.onOrdersUpdate?.(data);
      },
      onSwapsUpdate: (data) => {
        eventHandlersRef.current.onSwapsUpdate?.(data);
      },
      onPricesUpdate: (data) => {
        eventHandlersRef.current.onPricesUpdate?.(data);
      },
      onTransactionsUpdate: (data) => {
        eventHandlersRef.current.onTransactionsUpdate?.(data);
      },
      onRelayerUpdate: (data) => {
        eventHandlersRef.current.onRelayerUpdate?.(data);
      },
      onSystemUpdate: (data) => {
        eventHandlersRef.current.onSystemUpdate?.(data);
      },
    };

    wsService.setEventHandlers(handlers);

    // Update subscriptions state
    setSubscriptions(wsService.getSubscriptions());

    return () => {
      if (!reconnectOnClose) {
        wsService.disconnect();
      }
    };
  }, [autoConnect, reconnectOnClose]);

  const connect = () => {
    wsService.connect();
  };

  const disconnect = () => {
    wsService.disconnect();
  };

  const subscribe = (topics: string[]) => {
    wsService.subscribe(topics);
    setSubscriptions(wsService.getSubscriptions());
  };

  const unsubscribe = (topics: string[]) => {
    wsService.unsubscribe(topics);
    setSubscriptions(wsService.getSubscriptions());
  };

  const send = (message: any) => {
    wsService.send(message);
  };

  const ping = () => {
    wsService.ping();
  };

  const getStatus = () => {
    wsService.getStatus();
  };

  const getRooms = () => {
    wsService.getRooms();
  };

  const setEventHandlers = (handlers: Partial<WebSocketEventHandlers>) => {
    eventHandlersRef.current = { ...eventHandlersRef.current, ...handlers };
    wsService.setEventHandlers(eventHandlersRef.current);
  };

  return {
    isConnected,
    connectionState,
    subscriptions,
    lastMessage,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    ping,
    getStatus,
    getRooms,
    setEventHandlers,
  };
};

// Hook for specific WebSocket topics
export const useWebSocketTopic = (topic: string, options: UseWebSocketOptions = {}) => {
  const ws = useWebSocket(options);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (ws.isConnected) {
      ws.subscribe([topic]);
    }

    return () => {
      ws.unsubscribe([topic]);
    };
  }, [ws.isConnected, topic]);

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {};

    switch (topic) {
      case 'orders':
        handlers.onOrdersUpdate = setData;
        break;
      case 'swaps':
        handlers.onSwapsUpdate = setData;
        break;
      case 'prices':
        handlers.onPricesUpdate = setData;
        break;
      case 'transactions':
        handlers.onTransactionsUpdate = setData;
        break;
      case 'relayer':
        handlers.onRelayerUpdate = setData;
        break;
      case 'system':
        handlers.onSystemUpdate = setData;
        break;
    }

    ws.setEventHandlers(handlers);
  }, [topic]);

  return {
    ...ws,
    data,
  };
};

// Hook for real-time order updates
export const useOrderUpdates = (orderId?: string) => {
  const ws = useWebSocketTopic('orders');
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      ws.setEventHandlers({
        onOrdersUpdate: (data) => {
          if (data.order && data.order.id === orderId) {
            setOrderData(data.order);
          }
        },
      });
    }
  }, [orderId]);

  return {
    ...ws,
    orderData,
  };
};

// Hook for real-time swap updates
export const useSwapUpdates = (swapId?: string) => {
  const ws = useWebSocketTopic('swaps');
  const [swapData, setSwapData] = useState<any>(null);

  useEffect(() => {
    if (swapId) {
      ws.setEventHandlers({
        onSwapsUpdate: (data) => {
          if (data.swap && data.swap.id === swapId) {
            setSwapData(data.swap);
          }
        },
      });
    }
  }, [swapId]);

  return {
    ...ws,
    swapData,
  };
};

// Hook for real-time price updates
export const usePriceUpdates = (chain?: string, tokenAddress?: string) => {
  const ws = useWebSocketTopic('prices');
  const [priceData, setPriceData] = useState<any>(null);

  useEffect(() => {
    if (chain && tokenAddress) {
      ws.setEventHandlers({
        onPricesUpdate: (data) => {
          if (data.prices && data.prices[`${chain}-${tokenAddress}`]) {
            setPriceData(data.prices[`${chain}-${tokenAddress}`]);
          }
        },
      });
    }
  }, [chain, tokenAddress]);

  return {
    ...ws,
    priceData,
  };
};
