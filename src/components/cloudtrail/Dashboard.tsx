import { useMemo } from "react";
import { CloudTrailEvent } from "@/types/cloudtrail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, AlertTriangle, Zap, Users } from "lucide-react";

const COLORS = [
  "hsl(210, 70%, 50%)",
  "hsl(180, 60%, 45%)",
  "hsl(340, 65%, 50%)",
  "hsl(45, 80%, 50%)",
  "hsl(270, 55%, 55%)",
  "hsl(120, 50%, 45%)",
  "hsl(15, 75%, 50%)",
  "hsl(200, 65%, 55%)",
];

interface DashboardProps {
  events: CloudTrailEvent[];
}

export function Dashboard({ events }: DashboardProps) {
  const stats = useMemo(() => {
    const byService: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const byApi: Record<string, number> = {};
    let errorCount = 0;

    events.forEach((e) => {
      const svc = e.eventSource.split(".")[0];
      byService[svc] = (byService[svc] || 0) + 1;
      byUser[e.username] = (byUser[e.username] || 0) + 1;
      byApi[e.eventName] = (byApi[e.eventName] || 0) + 1;
      if (e.errorCode) errorCount++;
    });

    const serviceData = Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const userData = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const topApis = Object.entries(byApi)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { serviceData, userData, errorCount, topApis, total: events.length };
  }, [events]);

  if (events.length === 0) {
    return <p className="py-24 text-center text-muted-foreground">Load events to see the dashboard</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{stats.errorCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.userData.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top API Call</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{stats.topApis[0]?.[0] ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{stats.topApis[0]?.[1] ?? 0} calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Events by Service</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.serviceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(210, 70%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Events by User</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.userData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => e.name}>
                  {stats.userData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top API calls */}
      <Card>
        <CardHeader><CardTitle className="text-base">Most Used API Calls</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topApis.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm font-medium">{name}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(count / stats.total) * 100}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
