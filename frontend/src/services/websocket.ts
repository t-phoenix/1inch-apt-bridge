// WebSocket service for real-time updates
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface WebSocketEventHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onOrdersUpdate?: (orders: any[]) => void;
  onSwapsUpdate?: (swaps: any[]) => void;
  onPricesUpdate?: (prices: any) => void;
  onTransactionsUpdate?: (transactions: any[]) => void;
  onRelayerUpdate?: (relayer: any) => void;
  onSystemUpdate?: (system: any) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventHandlers: WebSocketEventHandlers = {};
  private isConnecting = false;
  private subscriptions = new Set<string>();

  constructor() {
    this.connect();
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.eventHandlers.onOpen?.();

      // Re-subscribe to previous topics
      if (this.subscriptions.size > 0) {
        this.subscribe(Array.from(this.subscriptions));
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnecting = false;
      this.eventHandlers.onClose?.();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
      this.eventHandlers.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  private handleMessage(message: WebSocketMessage) {
    this.eventHandlers.onMessage?.(message);

    switch (message.type) {
      case 'orders':
        this.eventHandlers.onOrdersUpdate?.(message.data);
        break;
      case 'swaps':
        this.eventHandlers.onSwapsUpdate?.(message.data);
        break;
      case 'prices':
        this.eventHandlers.onPricesUpdate?.(message.data);
        break;
      case 'transactions':
        this.eventHandlers.onTransactionsUpdate?.(message.data);
        break;
      case 'relayer':
        this.eventHandlers.onRelayerUpdate?.(message.data);
        break;
      case 'system':
        this.eventHandlers.onSystemUpdate?.(message.data);
        break;
      case 'welcome':
        console.log('WebSocket welcome:', message.data);
        break;
      case 'error':
        console.error('WebSocket error:', message.data);
        break;
      case 'pong':
        console.log('WebSocket pong received');
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  subscribe(topics: string[]) {
    const validTopics = ['orders', 'swaps', 'prices', 'transactions', 'relayer', 'system'];
    const invalidTopics = topics.filter(topic => !validTopics.includes(topic));

    if (invalidTopics.length > 0) {
      console.warn(`Invalid topics: ${invalidTopics.join(', ')}`);
    }

    const validTopicsToSubscribe = topics.filter(topic => validTopics.includes(topic));
    
    if (validTopicsToSubscribe.length > 0) {
      this.send({
        type: 'subscribe',
        topics: validTopicsToSubscribe
      });

      validTopicsToSubscribe.forEach(topic => this.subscriptions.add(topic));
    }
  }

  unsubscribe(topics: string[]) {
    this.send({
      type: 'unsubscribe',
      topics
    });

    topics.forEach(topic => this.subscriptions.delete(topic));
  }

  ping() {
    this.send({
      type: 'ping',
      timestamp: Date.now()
    });
  }

  getStatus() {
    this.send({
      type: 'get_status',
      timestamp: Date.now()
    });
  }

  getRooms() {
    this.send({
      type: 'get_rooms',
      timestamp: Date.now()
    });
  }

  setEventHandlers(handlers: WebSocketEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getConnectionState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

export const wsService = new WebSocketService();
export default wsService;
