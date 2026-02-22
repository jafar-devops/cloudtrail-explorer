import { CloudTrailEvent } from "@/types/cloudtrail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, BarChart3, Table2, FolderTree, Filter, Settings, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TopBarProps {
  breadcrumb: string[];
  totalCount: number;
  search: string;
  onSearchChange: (v: string) => void;
  view: "table" | "dashboard";
  onViewChange: (v: "table" | "dashboard") => void;
  density: "comfortable" | "compact";
  onDensityChange: (v: "comfortable" | "compact") => void;
  events: CloudTrailEvent[];
  onToggleFolders: () => void;
  onToggleFilters: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

function exportData(events: CloudTrailEvent[], format: "csv" | "json") {
  let content: string;
  let mime: string;
  let ext: string;

  if (format === "json") {
    content = JSON.stringify(events, null, 2);
    mime = "application/json";
    ext = "json";
  } else {
    const headers = ["eventTime", "eventName", "eventSource", "username", "accountId", "awsRegion", "sourceIPAddress", "resourceName", "resourceType", "readOnly", "errorCode"];
    const rows = events.map((e) => headers.map((h) => String((e as any)[h] ?? "")).join(","));
    content = [headers.join(","), ...rows].join("\n");
    mime = "text/csv";
    ext = "csv";
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cloudtrail-events.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TopBar({
  breadcrumb,
  totalCount,
  search,
  onSearchChange,
  view,
  onViewChange,
  density,
  onDensityChange,
  events,
  onToggleFolders,
  onToggleFilters,
  onSettings,
  onLogout,
}: TopBarProps) {
  return (
    <header className="relative z-20 m-3 mb-0 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-slate-100 hover:bg-white/10 hover:text-cyan-300" onClick={onToggleFolders} title="Toggle folders">
          <FolderTree className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-100 hover:bg-white/10 hover:text-cyan-300" onClick={onToggleFilters} title="Toggle filters">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-slate-400">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumb.length - 1 ? "font-semibold text-slate-100" : ""}>{crumb}</span>
            </span>
          ))}
        </nav>
      )}

      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
        {totalCount} events
      </span>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="h-9 w-56 border-white/10 bg-slate-900/70 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400"
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex rounded-lg border border-white/10 bg-slate-900/70">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-r-none text-slate-100 hover:bg-white/10"
            onClick={() => onViewChange("table")}
          >
            <Table2 className="mr-1 h-4 w-4" /> Table
          </Button>
          <Button
            variant={view === "dashboard" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-l-none text-slate-100 hover:bg-white/10"
            onClick={() => onViewChange("dashboard")}
          >
            <BarChart3 className="mr-1 h-4 w-4" /> Dashboard
          </Button>
        </div>

        <div className="flex rounded-lg border border-white/10 bg-slate-900/70">
          <Button
            variant={density === "comfortable" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-r-none text-slate-100 hover:bg-white/10"
            onClick={() => onDensityChange("comfortable")}
          >
            Comfortable
          </Button>
          <Button
            variant={density === "compact" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-l-none text-slate-100 hover:bg-white/10"
            onClick={() => onDensityChange("compact")}
          >
            Compact
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-white/10 bg-slate-900/70 text-slate-100 hover:bg-white/10">
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportData(events, "csv")}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportData(events, "json")}>Export as JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="text-slate-100 hover:bg-white/10 hover:text-cyan-300" onClick={onSettings} title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-100 hover:bg-white/10 hover:text-rose-300" onClick={onLogout} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
