import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { loadSettings, saveSettings, connectToBucket } from "@/services/api";
import { Shield, Server, Loader2 } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!settings.useMockData && !settings.apiUrl) {
      toast({ title: "Error", description: "Please enter a backend API URL", variant: "destructive" });
      return;
    }
    setConnecting(true);
    try {
      const res = await connectToBucket(settings);
      if (res.success) {
        saveSettings(settings);
        toast({ title: "Connected", description: res.message });
        navigate("/explorer");
      } else {
        toast({ title: "Connection Failed", description: res.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Connection Error", description: err.message || "Could not reach backend", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">CloudTrail Log Analyzer</CardTitle>
          <CardDescription>Connect to your backend API to browse CloudTrail logs from a local folder path</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Use Mock Data</Label>
              <p className="text-xs text-muted-foreground">Explore the UI with sample CloudTrail events</p>
            </div>
            <Switch
              checked={settings.useMockData}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, useMockData: v }))}
            />
          </div>

          {!settings.useMockData && (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiUrl">Backend API URL</Label>
                <div className="relative">
                  <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="apiUrl"
                    placeholder="https://your-backend.example.com/api"
                    value={settings.apiUrl}
                    onChange={(e) => setSettings((s) => ({ ...s, apiUrl: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </>
          )}

          <Button onClick={handleConnect} className="w-full" size="lg" disabled={connecting}>
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {connecting ? "Connecting..." : "Connect & Explore"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
