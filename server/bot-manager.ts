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
}

export interface BotStatus {
  id: string;
  nickname: string;
  serverIp: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
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
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(httpServer: Server) {
    super();
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      // Send current bot statuses
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
        auth: 'offline', // Offline mode (no Microsoft auth)
      });

      this.bots.set(config.id, bot);

      bot.once('spawn', () => {
        this.emitLog(config.id, 'System', 'Connected successfully!', 'system');
        
        // Login with password if provided
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
        // Update position periodically (throttled)
        this.updateBotStatus(config.id);
      });

      bot.on('chat', (username, message) => {
        this.emitLog(config.id, username, message, 'chat');
      });

      bot.on('whisper', (username, message) => {
        this.emitLog(config.id, username, message, 'whisper');
        
        // Auto-TP feature
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
        this.disconnectBot(config.id);
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

      bot.on('end', () => {
        this.emitLog(config.id, 'System', 'Disconnected from server.', 'system');
        this.bots.delete(config.id);
        this.broadcast({
          type: 'bot_status',
          bot: {
            id: config.id,
            nickname: config.nickname,
            serverIp: config.host,
            status: 'offline',
            health: 0,
            food: 0,
            position: { x: 0, y: 0, z: 0 },
          }
        });
      });

    } catch (error: any) {
      this.emitLog(config.id, 'System', `Failed to connect: ${error.message}`, 'system');
      throw error;
    }
  }

  disconnectBot(botId: string): void {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.quit();
      this.bots.delete(botId);
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
    this.bots.forEach((bot, id) => {
      statuses.push({
        id,
        nickname: bot.username,
        serverIp: `${(bot as any)._client?.socket?.remoteAddress || 'unknown'}`,
        status: 'online',
        health: bot.health,
        food: bot.food,
        position: {
          x: Math.round(bot.entity.position.x),
          y: Math.round(bot.entity.position.y),
          z: Math.round(bot.entity.position.z),
        },
      });
    });
    return statuses;
  }

  getBotStatus(botId: string): BotStatus | null {
    const bot = this.bots.get(botId);
    if (!bot) return null;

    return {
      id: botId,
      nickname: bot.username,
      serverIp: `${(bot as any)._client?.socket?.remoteAddress || 'unknown'}`,
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
}
