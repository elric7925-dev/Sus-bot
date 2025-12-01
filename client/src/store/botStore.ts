import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface BotProfile {
  id: string;
  email: string;
  username: string;
  password?: string; // In a real app, be careful. Here it's local storage mock.
  serverIp: string;
  port: string;
  nickname: string;
}

export interface Bot {
  id: string;
  profileId?: string;
  nickname: string;
  serverIp: string;
  status: 'online' | 'offline' | 'connecting';
  health: number;
  food: number;
  position: { x: number; y: number; z: number };
}

export interface ChatMessage {
  id: string;
  botId: string;
  sender: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'whisper' | 'system';
}

interface BotState {
  bots: Bot[];
  profiles: BotProfile[];
  logs: Record<string, ChatMessage[]>;
  selectedBotId: string | null;

  // Actions
  addProfile: (profile: Omit<BotProfile, 'id'>) => void;
  deleteProfile: (id: string) => void;
  connectBot: (profile: BotProfile) => void;
  disconnectBot: (botId: string) => void;
  selectBot: (botId: string | null) => void;
  sendChatMessage: (botId: string, message: string) => void;
  simulateIncomingMessage: (botId: string, sender: string, content: string) => void;
}

export const useBotStore = create<BotState>()(
  persist(
    (set, get) => ({
      bots: [],
      profiles: [],
      logs: {},
      selectedBotId: null,

      addProfile: (profileData) =>
        set((state) => ({
          profiles: [...state.profiles, { ...profileData, id: uuidv4() }],
        })),

      deleteProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
        })),

      connectBot: (profile) => {
        const botId = uuidv4();
        const newBot: Bot = {
          id: botId,
          profileId: profile.id,
          nickname: profile.nickname || profile.username,
          serverIp: profile.serverIp,
          status: 'connecting',
          health: 20,
          food: 20,
          position: { x: 100, y: 64, z: -200 },
        };

        set((state) => ({
          bots: [...state.bots, newBot],
          logs: {
            ...state.logs,
            [botId]: [
              {
                id: uuidv4(),
                botId,
                sender: 'System',
                content: `Connecting to ${profile.serverIp}...`,
                timestamp: Date.now(),
                type: 'system',
              },
            ],
          },
          selectedBotId: state.selectedBotId || botId, // Auto select if first
        }));

        // Simulate connection success
        setTimeout(() => {
          set((state) => ({
            bots: state.bots.map((b) =>
              b.id === botId ? { ...b, status: 'online' } : b
            ),
            logs: {
              ...state.logs,
              [botId]: [
                ...(state.logs[botId] || []),
                {
                  id: uuidv4(),
                  botId,
                  sender: 'System',
                  content: 'Connected successfully.',
                  timestamp: Date.now(),
                  type: 'system',
                },
              ],
            },
          }));
        }, 1500);
      },

      disconnectBot: (botId) =>
        set((state) => ({
          bots: state.bots.filter((b) => b.id !== botId),
          selectedBotId: state.selectedBotId === botId ? null : state.selectedBotId,
        })),

      selectBot: (botId) => set({ selectedBotId: botId }),

      sendChatMessage: (botId, message) => {
        set((state) => ({
          logs: {
            ...state.logs,
            [botId]: [
              ...(state.logs[botId] || []),
              {
                id: uuidv4(),
                botId,
                sender: 'Me',
                content: message,
                timestamp: Date.now(),
                type: 'chat',
              },
            ],
          },
        }));
      },

      simulateIncomingMessage: (botId, sender, content) => {
        const state = get();
        const bot = state.bots.find((b) => b.id === botId);
        
        if (!bot) return;

        set((state) => ({
          logs: {
            ...state.logs,
            [botId]: [
              ...(state.logs[botId] || []),
              {
                id: uuidv4(),
                botId,
                sender,
                content,
                timestamp: Date.now(),
                type: 'whisper',
              },
            ],
          },
        }));

        // Auto-TP Logic
        // Pattern: /msg <botname> tpmekaro <playername>
        // In real MC, the bot receives "Sender whispers: tpmekaro <playername>" if it's a private message.
        // But the prompt says: "When someone privately messages the bot this pattern: /msg <botname> tpmekaro <playername>"
        // Usually, the sender types that, but the bot RECEIVES: "Sender whispers: tpmekaro <playername>" or similar.
        // However, if the prompt implies the BOT sees the command literally (maybe via a bridge or chat plugin), I will check for the content.
        
        // Let's assume the bot sees the raw content of the whisper.
        const triggerPhrase = "tpmekaro";
        if (content.includes(triggerPhrase)) {
           // Extract player name - simplistic
           const parts = content.split(' ');
           const targetPlayerIndex = parts.indexOf(triggerPhrase) + 1;
           const targetPlayer = parts[targetPlayerIndex] || sender; // Default to sender if not specified

           setTimeout(() => {
             const response = `/tpahere ${targetPlayer}`;
             get().sendChatMessage(botId, response);
           }, 500);
        }
      },
    }),
    {
      name: 'mc-bot-manager-storage',
    }
  )
);