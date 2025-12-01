import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBotStore, BotProfile } from "@/store/botStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Save, Download, Users } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  serverIp: z.string().min(1, "Server IP is required"),
  port: z.string().default("25565"),
  serverPass: z.string().optional(),
  nickname: z.string().min(1, "Nickname is required"),
  saveProfile: z.boolean().default(false),
});

export function BotLogin() {
  const { connectBot, addProfile, profiles, deleteProfile } = useBotStore();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      serverIp: "",
      port: "25565",
      serverPass: "",
      nickname: "MarvoBot",
      saveProfile: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const profile: BotProfile = {
      id: "", // ID generated in store
      username: values.username,
      password: values.serverPass,
      serverIp: values.serverIp,
      port: values.port,
      nickname: values.nickname,
    };

    if (values.saveProfile) {
      addProfile(profile);
    }

    connectBot(profile);
    setOpen(false);
    form.reset();
  }

  const loadProfile = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      form.reset({
        username: profile.username,
        serverIp: profile.serverIp,
        port: profile.port,
        serverPass: profile.password || "",
        nickname: profile.nickname,
        saveProfile: false,
      });
    }
  };

  const spawnAllBots = () => {
    profiles.forEach((profile) => {
      connectBot(profile);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold tracking-wider rounded-none border border-primary">
            <Plus className="w-4 h-4 mr-2" />
            DEPLOY NEW BOT
          </Button>
        </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground font-mono">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-widest text-primary">DEPLOYMENT CONFIG</DialogTitle>
        </DialogHeader>
        
        {profiles.length > 0 && (
          <div className="mb-4">
            <Select onValueChange={loadProfile}>
              <SelectTrigger className="w-full bg-secondary/50 border-border">
                <SelectValue placeholder="LOAD SAVED PROFILE" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="font-mono">
                    {p.nickname} @ {p.serverIp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">Bot Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="MarvoBot" {...field} className="bg-black/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">MC Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Notch" {...field} className="bg-black/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email and Password fields removed as requested */}

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="serverIp"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-xs uppercase text-muted-foreground">Server IP</FormLabel>
                    <FormControl>
                      <Input placeholder="mc.hypixel.net" {...field} className="bg-black/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">Port</FormLabel>
                    <FormControl>
                      <Input placeholder="25565" {...field} className="bg-black/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serverPass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase text-muted-foreground">Server Password (Optional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="/login password" {...field} className="bg-black/20" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="saveProfile"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-3 bg-secondary/20">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs font-bold text-primary cursor-pointer">
                      SAVE PROFILE TO DISK
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold rounded-none">
              INITIALIZE CONNECTION
            </Button>
          </form>
        </Form>
      </DialogContent>
      </Dialog>
      
      {profiles.length > 0 && (
        <Button 
          variant="outline"
          className="w-full font-bold tracking-wider rounded-none border-accent text-accent hover:bg-accent/10"
          onClick={spawnAllBots}
          data-testid="spawn-all-button"
        >
          <Users className="w-4 h-4 mr-2" />
          SPAWN ALL ({profiles.length})
        </Button>
      )}
    </div>
  );
}