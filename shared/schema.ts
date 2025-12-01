import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botProfiles = pgTable("bot_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  serverIp: text("server_ip").notNull(),
  port: text("port").notNull().default("25565"),
  password: text("password"),
  nickname: text("nickname").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBotProfileSchema = createInsertSchema(botProfiles).omit({
  id: true,
  createdAt: true,
});

export type InsertBotProfile = z.infer<typeof insertBotProfileSchema>;
export type BotProfile = typeof botProfiles.$inferSelect;

export const chatLogs = pgTable("chat_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: text("bot_id").notNull(),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(), // 'chat' | 'whisper' | 'system'
});

export const insertChatLogSchema = createInsertSchema(chatLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertChatLog = z.infer<typeof insertChatLogSchema>;
export type ChatLog = typeof chatLogs.$inferSelect;
