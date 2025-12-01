import { useState, useRef, useEffect } from "react";
import { useBotStore } from "@/store/botStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Terminal, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BotChat() {
  const { selectedBotId, bots, logs, sendChatMessage } = useBotStore();
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const selectedBot = bots.find(b => b.id === selectedBotId);
  const botLogs = selectedBotId ? (logs[selectedBotId] || []) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [botLogs]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !selectedBotId) return;
    
    sendChatMessage(selectedBotId, inputValue);
    setInputValue("");
  };

  if (!selectedBot) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border bg-card/30">
        <Terminal className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-mono text-sm">SELECT A UNIT TO ACCESS TERMINAL</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/20 border border-border relative overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-mono font-bold text-sm tracking-wider">TERMINAL // {selectedBot.nickname}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          CONNECTED
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 font-mono text-sm">
        <div className="space-y-1">
          {botLogs.map((log) => (
            <div key={log.id} className="flex gap-2 break-all hover:bg-white/5 p-1 rounded transition-colors">
              <span className="text-muted-foreground text-[10px] whitespace-nowrap pt-1">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <div className="flex-1">
                {log.type === 'system' && (
                  <span className="text-yellow-500">[SYS] {log.content}</span>
                )}
                {log.type === 'chat' && (
                  <span className="text-foreground">
                    <span className="text-primary font-bold">&lt;{log.sender}&gt;</span> {log.content}
                  </span>
                )}
                {log.type === 'whisper' && (
                  <span className="text-mc-blue italic">
                    {log.sender} whispers: {log.content}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-card border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <div className="relative flex-1">
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter command or message..."
              className="font-mono bg-black/40 border-border focus:border-primary pr-10 h-10"
            />
            <div className="absolute right-2 top-2.5 text-[10px] text-muted-foreground font-mono">
              &gt;_
            </div>
          </div>
          <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 text-black rounded-none w-10 h-10">
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="mt-2 text-[10px] text-muted-foreground font-mono">
          Auto-TP enabled: whisper "tpmekaro [player]" to trigger /tpahere
        </div>
      </div>
    </div>
  );
}