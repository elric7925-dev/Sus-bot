import { useBotStore } from "@/store/botStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Activity, MapPin, Trash2, RefreshCw, Power, PowerOff } from "lucide-react";

export function BotList() {
  const { bots, selectedBotId, selectBot, disconnectBot, reconnectBot, removeBot } = useBotStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-primary shadow-primary';
      case 'connecting': return 'bg-yellow-500 shadow-yellow-500 animate-pulse';
      case 'reconnecting': return 'bg-orange-500 shadow-orange-500 animate-pulse';
      case 'error': return 'bg-destructive shadow-destructive';
      default: return 'bg-muted-foreground shadow-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'ONLINE';
      case 'connecting': return 'CONNECTING...';
      case 'reconnecting': return 'RECONNECTING...';
      case 'error': return 'ERROR';
      default: return 'OFFLINE';
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground tracking-wider">ACTIVE BOTS</h2>
        <span className="text-xs font-mono text-muted-foreground">
          {bots.filter(b => b.status === 'online').length}/{bots.length}
        </span>
      </div>
      
      <ScrollArea className="flex-1 h-[calc(100vh-350px)]">
        <div className="space-y-2 pr-2">
          {bots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border p-4">
              No bots deployed.
              <br />
              Click "Deploy New Bot" to begin.
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
                    getStatusColor(bot.status)
                  )} />
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {bot.nickname}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {getStatusText(bot.status)}
                    </span>
                  </div>
                </div>
              </div>

              {bot.status === 'online' && (
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-red-400" />
                    <span>{bot.health}/20 HP</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{bot.position.x}, {bot.position.y}, {bot.position.z}</span>
                  </div>
                </div>
              )}
              
              {bot.status === 'online' && (
                <div className="w-full h-1 bg-secondary mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500" 
                    style={{ width: `${(bot.health / 20) * 100}%` }}
                  />
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {bot.status === 'online' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px] font-mono border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      disconnectBot(bot.id, false);
                    }}
                  >
                    <PowerOff className="w-3 h-3 mr-1" />
                    DISCONNECT
                  </Button>
                )}
                
                {(bot.status === 'offline' || bot.status === 'error') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px] font-mono border-primary/50 text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      reconnectBot(bot.id);
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    RECONNECT
                  </Button>
                )}

                {bot.status === 'reconnecting' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px] font-mono border-orange-500/50 text-orange-500"
                    disabled
                  >
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    RECONNECTING...
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] font-mono border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectBot(bot.id, true);
                    removeBot(bot.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  REMOVE
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
