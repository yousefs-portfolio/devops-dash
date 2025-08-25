import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  lastPing?: number;
}

interface WebSocketStatusProps {
  state: WebSocketState;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ state }) => {
  return (
    <div className="flex items-center gap-2">
      {state.connected ? (
        <>
          <Wifi size={16} className="text-success" />
          <span className="text-xs text-success">Connected</span>
        </>
      ) : state.connecting ? (
        <>
          <Wifi size={16} className="text-warning animate-pulse" />
          <span className="text-xs text-warning">Connecting...</span>
        </>
      ) : (
        <>
          <WifiOff size={16} className="text-critical" />
          <span className="text-xs text-critical">Disconnected</span>
        </>
      )}
      {state.lastPing && (
        <span className="text-xs text-gray-500">
          ({Math.round((Date.now() - state.lastPing) / 1000)}s ago)
        </span>
      )}
    </div>
  );
};