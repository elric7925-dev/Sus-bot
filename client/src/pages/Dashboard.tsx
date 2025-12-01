import { BotLogin } from "@/components/BotLogin";
import { BotList } from "@/components/BotList";
import { BotChat } from "@/components/BotChat";
import { SavedProfiles } from "@/components/SavedProfiles";
import { Separator } from "@/components/ui/separator";
import { Box, Cpu, Network, Zap } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card/30 backdrop-blur-sm">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Box className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-black tracking-tighter text-foreground">MARVO<span className="text-primary">BOT</span></h1>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">MC BOT COMMANDER // v2.0</p>
        </div>
        
        <div className="p-4">
          <BotLogin />
        </div>

        <SavedProfiles />

        <Separator className="bg-border/50 my-2" />

        <div className="flex-1 py-2 overflow-hidden">
          <BotList />
        </div>

        <div className="p-4 border-t border-border bg-black/20 text-[10px] font-mono text-muted-foreground">
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center gap-1"><Network className="w-3 h-3" /> STATUS</span>
            <span className="text-primary">OPERATIONAL</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> AUTO-RECONNECT</span>
            <span className="text-yellow-500">ENABLED</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> AUTO-TP</span>
            <span className="text-cyan-500">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <BotChat />
      </div>
    </div>
  );
}
