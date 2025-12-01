import { useBotStore } from "@/store/botStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Trash2, Server } from "lucide-react";

export function SavedProfiles() {
  const { profiles, deleteProfile, connectBot } = useBotStore();

  if (profiles.length === 0) {
    return null;
  }

  const handleQuickLaunch = (profile: typeof profiles[0]) => {
    connectBot(profile);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-4">
        <Server className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-xs font-bold text-muted-foreground tracking-wider">SAVED PROFILES</h3>
      </div>
      
      <ScrollArea className="max-h-40 px-4">
        <div className="space-y-1">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="group flex items-center justify-between p-2 border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-mono text-xs font-bold text-foreground truncate">
                  {profile.nickname}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground truncate">
                  {profile.serverIp}:{profile.port}
                </span>
              </div>
              
              <div className="flex gap-1 ml-2">
                <Button
                  size="sm"
                  className="h-6 px-2 text-[10px] font-mono bg-primary hover:bg-primary/90 text-black"
                  onClick={() => handleQuickLaunch(profile)}
                  data-testid={`launch-profile-${profile.id}`}
                >
                  <Play className="w-3 h-3 mr-1" />
                  RUN
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] font-mono border-destructive/50 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteProfile(profile.id)}
                  data-testid={`delete-profile-${profile.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
