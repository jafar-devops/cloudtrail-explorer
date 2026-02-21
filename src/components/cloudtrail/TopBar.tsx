import { CloudTrailEvent } from "@/types/cloudtrail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, BarChart3, Table2, FolderTree, Filter, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TopBarProps {
  breadcrumb: string[];
  totalCount: number;
  search: string;
  onSearchChange: (v: string) => void;
  view: "table" | "dashboard";
  onViewChange: (v: "table" | "dashboard") => void;
  events: CloudTrailEvent[];
  onToggleFolders: () => void;
  onToggleFilters: () => void;
  onSettings: () => void;
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

export function TopBar({ breadcrumb, totalCount, search, onSearchChange, view, onViewChange, events, onToggleFolders, onToggleFilters, onSettings }: TopBarProps) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleFolders} title="Toggle folders">
          <FolderTree className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleFilters} title="Toggle filters">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumb.length - 1 ? "font-medium text-foreground" : ""}>{crumb}</span>
            </span>
          ))}
        </nav>
      )}

      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        {totalCount} events
      </span>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 w-56 pl-9 text-sm"
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex rounded-md border">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-r-none"
            onClick={() => onViewChange("table")}
          >
            <Table2 className="mr-1 h-4 w-4" /> Table
          </Button>
          <Button
            variant={view === "dashboard" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-l-none"
            onClick={() => onViewChange("dashboard")}
          >
            <BarChart3 className="mr-1 h-4 w-4" /> Dashboard
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportData(events, "csv")}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportData(events, "json")}>Export as JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={onSettings} title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
