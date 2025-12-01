import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { BotManager } from "./bot-manager";
import { insertBotProfileSchema } from "@shared/schema";
import { z } from "zod";

let botManager: BotManager;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  botManager = new BotManager(httpServer);

  app.get("/api/profiles", async (_req, res) => {
    try {
      const profiles = await storage.getAllBotProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const validatedData = insertBotProfileSchema.parse(req.body);
      const profile = await storage.createBotProfile(validatedData);
      res.json(profile);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      await storage.deleteBotProfile(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/connect", async (req, res) => {
    try {
      const { id, username, host, port, password, nickname } = req.body;
      
      if (!id || !username || !host || !nickname) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await botManager.connectBot({
        id,
        username,
        host,
        port: parseInt(port) || 25565,
        password,
        nickname,
        autoReconnect: true,
      });

      res.json({ success: true, botId: id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/disconnect", async (req, res) => {
    try {
      const permanent = req.query.permanent === 'true';
      botManager.disconnectBot(req.params.id, permanent);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/reconnect", async (req, res) => {
    try {
      await botManager.reconnectBot(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      botManager.sendChat(req.params.id, message);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bots/:id/status", async (req, res) => {
    try {
      const status = botManager.getBotStatus(req.params.id);
      if (!status) {
        return res.status(404).json({ error: "Bot not found" });
      }
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bots/:id/logs", async (req, res) => {
    try {
      const logs = await storage.getChatLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
