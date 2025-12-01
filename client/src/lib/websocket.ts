import { create } from 'zustand';

interface WebSocketState {
  ws: WebSocket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: any) => void;
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  ws: null,
  connected: false,

  connect: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      set({ connected: true });
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      set({ connected: false, ws: null });
      console.log('WebSocket disconnected');
      
      // Reconnect after 3 seconds
      setTimeout(() => {
        const state = get();
        if (!state.connected) {
          state.connect();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    set({ ws });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null, connected: false });
    }
  },

  send: (message: any) => {
    const { ws, connected } = get();
    if (ws && connected) {
      ws.send(JSON.stringify(message));
    }
  },
}));