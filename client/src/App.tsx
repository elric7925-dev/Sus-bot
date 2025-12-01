import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import { useEffect } from "react";
import { useWebSocket } from "@/lib/websocket";
import { useBotStore } from "@/store/botStore";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { connect, ws } = useWebSocket();
  const { updateBotStatus, addChatLog, loadProfiles } = useBotStore();

  useEffect(() => {
    connect();
    loadProfiles();
  }, []);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'bot_status') {
          updateBotStatus(data.bot);
        } else if (data.type === 'chat_log') {
          addChatLog(data.log);
        } else if (data.type === 'initial_status') {
          data.bots.forEach((bot: any) => updateBotStatus(bot));
        }
      } catch (error) {
        console.error('Failed to handle WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, updateBotStatus, addChatLog]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;