import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, KeyRound, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { authenticate, isAuthenticated } from "@/services/auth";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/settings", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ title: "Missing details", description: "Enter username and password", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const ok = await authenticate(username, password);
      if (!ok) {
        toast({ title: "Invalid credentials", description: "Username or password is incorrect", variant: "destructive" });
        return;
      }
      toast({ title: "Login successful", description: "Welcome to CloudTrail Explorer" });
      navigate("/settings", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast({ title: "Login error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-4xl overflow-hidden border-slate-200 shadow-2xl">
        <div className="grid md:grid-cols-2">
          <section className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-10 text-slate-100 md:flex md:flex-col md:justify-between">
            <div className="flex items-center gap-2 text-sm tracking-wide text-cyan-100/90">
              <ShieldCheck className="h-4 w-4" />
              CloudTrail Explorer
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight">Secure Event Intelligence</h1>
              <p className="text-sm text-slate-300">
                Centralized visibility for CloudTrail audit records with fast filtering and export-ready insights.
              </p>
            </div>
            <p className="text-xs text-slate-400">Authorized operators only</p>
          </section>

          <section className="bg-white p-6 md:p-10">
            <CardHeader className="space-y-2 p-0">
              <CardTitle className="text-2xl text-slate-900">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access the explorer</CardDescription>
            </CardHeader>

            <CardContent className="mt-6 space-y-5 p-0">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    placeholder="Enter username"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleLogin();
                      }
                    }}
                  />
                </div>
              </div>

              <Button onClick={() => void handleLogin()} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </CardContent>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default Login;
