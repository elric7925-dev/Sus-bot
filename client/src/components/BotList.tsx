import { useBotStore } from "@/store/botStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Activity, MapPin, Trash2 } from "lucide-react";

export function BotList() {
  const { bots, selectedBotId, selectBot, disconnectBot } = useBotStore();

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-bold text-foreground tracking-wider">ACTIVE BOTS</h2>
        <span className="text-xs font-mono text-muted-foreground">{bots.length} ONLINE</span>
      </div>
      
      <ScrollArea className="flex-1 h-[calc(100vh-300px)]">
        <div className="space-y-2 pr-4">
          {bots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border p-4">
              No bots connected.
              <br />
              Deploy a unit to begin.
            </div>
          )}
          
          {bots.map((bot) => (
            <div
              key={bot.id}
              onClick={() => selectBot(bot.id)}
              className={cn(
                "group relative flex flex-col gap-2 p-3 border transition-all cursor-pointer hover:bg-accent/5",
                selectedBotId === bot.id
                  ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(85,255,85,0.1)]"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full shadow-[0_0_8px]",
                    bot.status === 'online' 
                      ? "bg-primary shadow-primary" 
                      : "bg-yellow-500 shadow-yellow-500"
                  )} />
                  <span className="font-mono font-bold text-sm text-foreground">
                    {bot.nickname}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectBot(bot.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive-foreground hover:bg-destructive p-1 rounded transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-mc-red" />
                  <span>{bot.health}/20 HP</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <MapPin className="w-3 h-3 text-mc-blue" />
                  <span>{bot.position.x}, {bot.position.y}, {bot.position.z}</span>
                </div>
              </div>
              
              {/* Health Bar */}
              <div className="w-full h-1 bg-secondary mt-1 overflow-hidden">
                <div 
                  className="h-full bg-mc-red transition-all duration-500" 
                  style={{ width: `${(bot.health / 20) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}