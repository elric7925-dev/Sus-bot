import mineflayer, { Bot } from 'mineflayer';
import { EventEmitter } from 'events';
import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

export interface BotConfig {
  id: string;
  username: string;
  host: string;
  port: number;
  password?: string;
  nickname: string;
  autoReconnect?: boolean;
}

export interface BotStatus {
  id: string;
  nickname: string;
  serverIp: string;
  status: 'online' | 'offline' | 'connecting' | 'error' | 'reconnecting';
  health: number;
  food: number;
  position: { x: number; y: number; z: number };
  error?: string;
}

export interface ChatMessage {
  id: string;
  botId: string;
  sender: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'whisper' | 'system';
}

export class BotManager extends EventEmitter {
  private bots: Map<string, Bot> = new Map();
  private botConfigs: Map<string, BotConfig> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(httpServer: Server) {
    super();
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      const statuses = this.getAllBotStatuses();
      ws.send(JSON.stringify({ type: 'initial_status', bots: statuses }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(message);
        } catch (e) {
          console.error('Invalid WebSocket message:', e);
        }
      });
    });
  }

  private broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private handleClientMessage(message: any) {
    const { type, botId, content } = message;
    
    if (type === 'send_chat' && botId && content) {
      this.sendChat(botId, content);
    }
  }

  async connectBot(config: BotConfig): Promise<void> {
    if (this.bots.has(config.id)) {
      throw new Error('Bot already connected');
    }

    // Clear any existing reconnect timer
    const existingTimer = this.reconnectTimers.get(config.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.reconnectTimers.delete(config.id);
    }

    // Store config for reconnection
    this.botConfigs.set(config.id, { ...config, autoReconnect: config.autoReconnect ?? true });

    this.broadcast({
      type: 'bot_status',
      bot: {
        id: config.id,
        nickname: config.nickname,
        serverIp: config.host,
        status: 'connecting',
        health: 20,
        food: 20,
        position: { x: 0, y: 0, z: 0 },
      }
    });

    this.emitLog(config.id, 'System', `Connecting to ${config.host}:${config.port}...`, 'system');

    try {
      const bot = mineflayer.createBot({
        host: config.host,
        port: config.port,
        username: config.username,
        auth: 'offline',
      });

      this.bots.set(config.id, bot);

      bot.once('spawn', () => {
        this.emitLog(config.id, 'System', 'Connected successfully!', 'system');
        
        if (config.password) {
          setTimeout(() => {
            bot.chat(`/login ${config.password}`);
            this.emitLog(config.id, 'System', 'Executing login command...', 'system');
          }, 1000);
        }

        this.updateBotStatus(config.id);
      });

      bot.on('health', () => {
        this.updateBotStatus(config.id);
      });

      bot.on('move', () => {
        this.updateBotStatus(config.id);
      });

      bot.on('chat', (username, message) => {
        this.emitLog(config.id, username, message, 'chat');
      });

      bot.on('whisper', (username, message) => {
        this.emitLog(config.id, username, message, 'whisper');
        
        if (message.includes('tpmekaro')) {
          const parts = message.split(' ');
          const targetPlayerIndex = parts.indexOf('tpmekaro') + 1;
          const targetPlayer = parts[targetPlayerIndex] || username;
          
          setTimeout(() => {
            bot.chat(`/tpahere ${targetPlayer}`);
            this.emitLog(config.id, 'Me', `/tpahere ${targetPlayer}`, 'chat');
          }, 500);
        }
      });

      bot.on('kicked', (reason) => {
        this.emitLog(config.id, 'System', `Kicked: ${reason}`, 'system');
        this.handleDisconnect(config.id, 'kicked');
      });

      bot.on('error', (err) => {
        this.emitLog(config.id, 'System', `Error: ${err.message}`, 'system');
        this.broadcast({
          type: 'bot_status',
          bot: {
            id: config.id,
            nickname: config.nickname,
            serverIp: config.host,
            status: 'error',
            health: 0,
            food: 0,
            position: { x: 0, y: 0, z: 0 },
            error: err.message,
          }
        });
      });

      bot.on('end', (reason) => {
        this.emitLog(config.id, 'System', `Disconnected: ${reason || 'Unknown reason'}`, 'system');
        this.handleDisconnect(config.id, reason);
      });

    } catch (error: any) {
      this.emitLog(config.id, 'System', `Failed to connect: ${error.message}`, 'system');
      this.scheduleReconnect(config.id);
      throw error;
    }
  }

  private handleDisconnect(botId: string, reason?: string) {
    this.bots.delete(botId);
    const config = this.botConfigs.get(botId);
    
    if (config) {
      this.broadcast({
        type: 'bot_status',
        bot: {
          id: botId,
          nickname: config.nickname,
          serverIp: config.host,
          status: 'offline',
          health: 0,
          food: 0,
          position: { x: 0, y: 0, z: 0 },
        }
      });

      // Auto-reconnect if enabled
      if (config.autoReconnect) {
        this.scheduleReconnect(botId);
      }
    }
  }

  private scheduleReconnect(botId: string) {
    const config = this.botConfigs.get(botId);
    if (!config || !config.autoReconnect) return;

    // Clear any existing timer
    const existingTimer = this.reconnectTimers.get(botId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    this.emitLog(botId, 'System', 'Auto-reconnecting in 5 seconds...', 'system');
    
    this.broadcast({
      type: 'bot_status',
      bot: {
        id: botId,
        nickname: config.nickname,
        serverIp: config.host,
        status: 'reconnecting',
        health: 0,
        food: 0,
        position: { x: 0, y: 0, z: 0 },
      }
    });

    const timer = setTimeout(async () => {
      this.reconnectTimers.delete(botId);
      try {
        await this.connectBot(config);
      } catch (error: any) {
        this.emitLog(botId, 'System', `Reconnection failed: ${error.message}`, 'system');
      }
    }, 5000);

    this.reconnectTimers.set(botId, timer);
  }

  disconnectBot(botId: string, permanent: boolean = false): void {
    // Cancel any pending reconnection
    const timer = this.reconnectTimers.get(botId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(botId);
    }

    if (permanent) {
      // Disable auto-reconnect
      const config = this.botConfigs.get(botId);
      if (config) {
        config.autoReconnect = false;
      }
    }

    const bot = this.bots.get(botId);
    if (bot) {
      bot.quit();
      this.bots.delete(botId);
    }

    if (permanent) {
      this.botConfigs.delete(botId);
    }
  }

  async reconnectBot(botId: string): Promise<void> {
    const config = this.botConfigs.get(botId);
    if (!config) {
      throw new Error('Bot config not found. Use connect instead.');
    }

    // Disconnect first if still connected
    const existingBot = this.bots.get(botId);
    if (existingBot) {
      existingBot.quit();
      this.bots.delete(botId);
    }

    // Clear any pending reconnection
    const timer = this.reconnectTimers.get(botId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(botId);
    }

    // Re-enable auto-reconnect
    config.autoReconnect = true;

    // Connect with stored config
    await this.connectBot(config);
  }

  setAutoReconnect(botId: string, enabled: boolean): void {
    const config = this.botConfigs.get(botId);
    if (config) {
      config.autoReconnect = enabled;
    }
  }

  sendChat(botId: string, message: string): void {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.chat(message);
      this.emitLog(botId, 'Me', message, 'chat');
    }
  }

  private updateBotStatus(botId: string): void {
    const bot = this.bots.get(botId);
    if (!bot) return;

    const status: Partial<BotStatus> = {
      id: botId,
      status: 'online',
      health: bot.health,
      food: bot.food,
      position: {
        x: Math.round(bot.entity.position.x),
        y: Math.round(bot.entity.position.y),
        z: Math.round(bot.entity.position.z),
      },
    };

    this.broadcast({ type: 'bot_status', bot: status });
  }

  private emitLog(botId: string, sender: string, content: string, type: 'chat' | 'whisper' | 'system'): void {
    const logMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      botId,
      sender,
      content,
      timestamp: Date.now(),
      type,
    };

    this.broadcast({ type: 'chat_log', log: logMessage });
  }

  getAllBotStatuses(): BotStatus[] {
    const statuses: BotStatus[] = [];
    
    // Include both connected bots and reconnecting bots
    this.botConfigs.forEach((config, id) => {
      const bot = this.bots.get(id);
      const isReconnecting = this.reconnectTimers.has(id);
      
      if (bot) {
        statuses.push({
          id,
          nickname: config.nickname,
          serverIp: config.host,
          status: 'online',
          health: bot.health,
          food: bot.food,
          position: {
            x: Math.round(bot.entity.position.x),
            y: Math.round(bot.entity.position.y),
            z: Math.round(bot.entity.position.z),
          },
        });
      } else if (isReconnecting) {
        statuses.push({
          id,
          nickname: config.nickname,
          serverIp: config.host,
          status: 'reconnecting',
          health: 0,
          food: 0,
          position: { x: 0, y: 0, z: 0 },
        });
      }
    });
    
    return statuses;
  }

  getBotStatus(botId: string): BotStatus | null {
    const bot = this.bots.get(botId);
    const config = this.botConfigs.get(botId);
    
    if (!config) return null;

    if (bot) {
      return {
        id: botId,
        nickname: config.nickname,
        serverIp: config.host,
        status: 'online',
        health: bot.health,
        food: bot.food,
        position: {
          x: Math.round(bot.entity.position.x),
          y: Math.round(bot.entity.position.y),
          z: Math.round(bot.entity.position.z),
        },
      };
    }

    return {
      id: botId,
      nickname: config.nickname,
      serverIp: config.host,
      status: this.reconnectTimers.has(botId) ? 'reconnecting' : 'offline',
      health: 0,
      food: 0,
      position: { x: 0, y: 0, z: 0 },
    };
  }
}
