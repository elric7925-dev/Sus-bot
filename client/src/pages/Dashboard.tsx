import { BotLogin } from "@/components/BotLogin";
import { BotList } from "@/components/BotList";
import { BotChat } from "@/components/BotChat";
import { Separator } from "@/components/ui/separator";
import { Box, Cpu, Network } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card/30 backdrop-blur-sm">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Box className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-black tracking-tighter text-foreground">BOT<span className="text-primary">CMD</span></h1>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">V 1.0.4 // STABLE_BUILD</p>
        </div>
        
        <div className="p-4">
          <BotLogin />
        </div>

        <Separator className="bg-border/50" />

        <div className="flex-1 py-4">
          <BotList />
        </div>

        <div className="p-4 border-t border-border bg-black/20 text-[10px] font-mono text-muted-foreground">
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center gap-1"><Network className="w-3 h-3" /> NET_STATUS</span>
            <span className="text-primary">ONLINE</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> SYS_LOAD</span>
            <span>12%</span>
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