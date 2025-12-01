import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface BotProfile {
  id: string;
  username: string;
  password?: string;
  serverIp: string;
  port: string;
  nickname: string;
}

export interface Bot {
  id: string;
  profileId?: string;
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

interface BotState {
  bots: Bot[];
  profiles: BotProfile[];
  logs: Record<string, ChatMessage[]>;
  selectedBotId: string | null;

  // Actions
  addProfile: (profile: Omit<BotProfile, 'id'>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  connectBot: (profile: BotProfile) => Promise<void>;
  disconnectBot: (botId: string, permanent?: boolean) => Promise<void>;
  reconnectBot: (botId: string) => Promise<void>;
  selectBot: (botId: string | null) => void;
  sendChatMessage: (botId: string, message: string) => Promise<void>;
  updateBotStatus: (bot: Partial<Bot> & { id: string }) => void;
  addChatLog: (log: ChatMessage) => void;
  loadProfiles: () => Promise<void>;
  removeBot: (botId: string) => void;
}

export const useBotStore = create<BotState>()(
  persist(
    (set, get) => ({
      bots: [],
      profiles: [],
      logs: {},
      selectedBotId: null,

      loadProfiles: async () => {
        try {
          const response = await fetch('/api/profiles');
          if (response.ok) {
            const profiles = await response.json();
            set({ profiles });
          }
        } catch (error) {
          console.error('Failed to load profiles:', error);
        }
      },

      addProfile: async (profileData) => {
        try {
          const response = await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
          });

          if (response.ok) {
            const profile = await response.json();
            set((state) => ({
              profiles: [...state.profiles, profile],
            }));
          }
        } catch (error) {
          console.error('Failed to save profile:', error);
        }
      },

      deleteProfile: async (id) => {
        try {
          await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
          set((state) => ({
            profiles: state.profiles.filter((p) => p.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete profile:', error);
        }
      },

      connectBot: async (profile) => {
        const botId = uuidv4();
        const newBot: Bot = {
          id: botId,
          profileId: profile.id,
          nickname: profile.nickname || profile.username,
          serverIp: profile.serverIp,
          status: 'connecting',
          health: 20,
          food: 20,
          position: { x: 0, y: 0, z: 0 },
        };

        set((state) => ({
          bots: [...state.bots, newBot],
          logs: {
            ...state.logs,
            [botId]: [],
          },
          selectedBotId: state.selectedBotId || botId,
        }));

        try {
          const response = await fetch('/api/bots/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: botId,
              username: profile.username,
              host: profile.serverIp,
              port: profile.port,
              password: profile.password,
              nickname: profile.nickname,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to connect');
          }
        } catch (error: any) {
          set((state) => ({
            bots: state.bots.map((b) =>
              b.id === botId
                ? { ...b, status: 'error' as const, error: error.message }
                : b
            ),
          }));
          
          get().addChatLog({
            id: uuidv4(),
            botId,
            sender: 'System',
            content: `Connection failed: ${error.message}`,
            timestamp: Date.now(),
            type: 'system',
          });
        }
      },

      disconnectBot: async (botId, permanent = false) => {
        try {
          await fetch(`/api/bots/${botId}/disconnect?permanent=${permanent}`, {
            method: 'POST',
          });
          
          if (permanent) {
            set((state) => ({
              bots: state.bots.filter((b) => b.id !== botId),
              selectedBotId: state.selectedBotId === botId ? null : state.selectedBotId,
            }));
          }
        } catch (error) {
          console.error('Failed to disconnect bot:', error);
        }
      },

      reconnectBot: async (botId) => {
        try {
          await fetch(`/api/bots/${botId}/reconnect`, {
            method: 'POST',
          });
        } catch (error) {
          console.error('Failed to reconnect bot:', error);
        }
      },

      removeBot: (botId) => {
        set((state) => ({
          bots: state.bots.filter((b) => b.id !== botId),
          selectedBotId: state.selectedBotId === botId ? null : state.selectedBotId,
        }));
      },

      selectBot: (botId) => set({ selectedBotId: botId }),

      sendChatMessage: async (botId, message) => {
        try {
          await fetch(`/api/bots/${botId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          });
        } catch (error) {
          console.error('Failed to send chat:', error);
        }
      },

      updateBotStatus: (botUpdate) => {
        set((state) => {
          const existingBot = state.bots.find(b => b.id === botUpdate.id);
          
          if (!existingBot && botUpdate.status !== 'offline') {
            return {
              bots: [...state.bots, {
                id: botUpdate.id,
                nickname: botUpdate.nickname || 'Unknown',
                serverIp: botUpdate.serverIp || 'Unknown',
                status: botUpdate.status || 'connecting',
                health: botUpdate.health || 20,
                food: botUpdate.food || 20,
                position: botUpdate.position || { x: 0, y: 0, z: 0 },
              } as Bot],
            };
          }
          
          return {
            bots: state.bots.map((bot) =>
              bot.id === botUpdate.id ? { ...bot, ...botUpdate } : bot
            ),
          };
        });
      },

      addChatLog: (log) => {
        set((state) => ({
          logs: {
            ...state.logs,
            [log.botId]: [...(state.logs[log.botId] || []), log],
          },
        }));
      },
    }),
    {
      name: 'mc-bot-manager-storage',
      partialize: (state) => ({
        profiles: state.profiles,
      }),
    }
  )
);
