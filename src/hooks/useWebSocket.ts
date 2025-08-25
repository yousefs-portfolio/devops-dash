import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  auth?: Record<string, any>;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  lastPing?: number;
}

export interface UseWebSocketReturn {
  socket: Socket | null;
  state: WebSocketState;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
}

export const useWebSocket = (options: WebSocketOptions = {}): UseWebSocketReturn => {
  const {
      url = 'http://localhost:3002',
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    auth,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastPing: undefined,
  });

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));

    socketRef.current = io(url, {
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      auth,
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        error: null,
      }));
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
      }));
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error,
      }));
    });

    socketRef.current.on('ping', () => {
      setState(prev => ({
        ...prev,
        lastPing: Date.now(),
      }));
    });
  }, [url, reconnection, reconnectionAttempts, reconnectionDelay, auth]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        connected: false,
        connecting: false,
        error: null,
        lastPing: undefined,
      });
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Cannot emit event:', event);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // Only run on mount/unmount

  return {
    socket: socketRef.current,
    state,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};

// Hook for subscribing to specific metric updates
export interface MetricUpdate {
  projectId: string;
  type: string;
  value: number;
  timestamp: Date;
}

export const useMetricUpdates = (
  projectId?: string,
  metricTypes?: string[]
): MetricUpdate[] => {
  const [metrics, setMetrics] = useState<MetricUpdate[]>([]);
  const { on, off, emit, state } = useWebSocket();

  useEffect(() => {
    if (!state.connected) return;

    const handleMetricUpdate = (update: MetricUpdate) => {
      if (projectId && update.projectId !== projectId) return;
      if (metricTypes && !metricTypes.includes(update.type)) return;

      setMetrics(prev => {
        const newMetrics = [...prev, update];
        // Keep only last 100 updates
        return newMetrics.slice(-100);
      });
    };

    // Subscribe to metric updates
    if (projectId) {
      emit('subscribe:project', projectId);
    }
    if (metricTypes) {
      emit('subscribe:metrics', metricTypes);
    }

    on('metric:update', handleMetricUpdate);

    return () => {
      off('metric:update', handleMetricUpdate);
      if (projectId) {
        emit('unsubscribe:project', projectId);
      }
      if (metricTypes) {
        emit('unsubscribe:metrics', metricTypes);
      }
    };
  }, [state.connected, projectId, metricTypes, on, off, emit]);

  return metrics;
};

// Hook for real-time alerts
export interface AlertUpdate {
  id: string;
  projectId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export const useAlertUpdates = (projectId?: string): AlertUpdate[] => {
  const [alerts, setAlerts] = useState<AlertUpdate[]>([]);
  const { on, off, emit, state } = useWebSocket();

  useEffect(() => {
    if (!state.connected) return;

    const handleAlertUpdate = (alert: AlertUpdate) => {
      if (projectId && alert.projectId !== projectId) return;

      setAlerts(prev => {
        const newAlerts = [alert, ...prev];
        // Keep only last 50 alerts
        return newAlerts.slice(0, 50);
      });
    };

    // Subscribe to alerts
    if (projectId) {
      emit('subscribe:alerts', projectId);
    } else {
      emit('subscribe:alerts', 'all');
    }

    on('alert:new', handleAlertUpdate);

    return () => {
      off('alert:new', handleAlertUpdate);
      emit('unsubscribe:alerts', projectId || 'all');
    };
  }, [state.connected, projectId, on, off, emit]);

  return alerts;
};

