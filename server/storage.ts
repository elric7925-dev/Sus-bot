import { type BotProfile, type InsertBotProfile, type ChatLog, type InsertChatLog } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Bot Profiles
  getBotProfile(id: string): Promise<BotProfile | undefined>;
  getAllBotProfiles(): Promise<BotProfile[]>;
  createBotProfile(profile: InsertBotProfile): Promise<BotProfile>;
  deleteBotProfile(id: string): Promise<void>;
  
  // Chat Logs
  getChatLogs(botId: string, limit?: number): Promise<ChatLog[]>;
  createChatLog(log: InsertChatLog): Promise<ChatLog>;
}

export class MemStorage implements IStorage {
  private botProfiles: Map<string, BotProfile>;
  private chatLogs: ChatLog[];

  constructor() {
    this.botProfiles = new Map();
    this.chatLogs = [];
  }

  // Bot Profiles
  async getBotProfile(id: string): Promise<BotProfile | undefined> {
    return this.botProfiles.get(id);
  }

  async getAllBotProfiles(): Promise<BotProfile[]> {
    return Array.from(this.botProfiles.values());
  }

  async createBotProfile(insertProfile: InsertBotProfile): Promise<BotProfile> {
    const id = randomUUID();
    const profile: BotProfile = {
      ...insertProfile,
      id,
      port: insertProfile.port || "25565",
      password: insertProfile.password || null,
      createdAt: new Date(),
    };
    this.botProfiles.set(id, profile);
    return profile;
  }

  async deleteBotProfile(id: string): Promise<void> {
    this.botProfiles.delete(id);
  }

  // Chat Logs
  async getChatLogs(botId: string, limit: number = 100): Promise<ChatLog[]> {
    return this.chatLogs
      .filter(log => log.botId === botId)
      .slice(-limit);
  }

  async createChatLog(insertLog: InsertChatLog): Promise<ChatLog> {
    const id = randomUUID();
    const log: ChatLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.chatLogs.push(log);
    return log;
  }
}

export const storage = new MemStorage();
