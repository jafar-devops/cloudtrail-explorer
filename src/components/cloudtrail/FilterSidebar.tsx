import { Filters, emptyFilters } from "@/types/cloudtrail";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  uniqueValues: {
    resourceTypes: string[];
    accountIds: string[];
    regions: string[];
  };
  density: "comfortable" | "compact";
}

export function FilterSidebar({ filters, onFiltersChange, uniqueValues, density }: FilterSidebarProps) {
  const set = (key: keyof Filters, value: any) => onFiltersChange({ ...filters, [key]: value });
  const controlHeight = density === "compact" ? "h-7" : "h-8";
  const controlText = density === "compact" ? "text-[11px]" : "text-xs";
  const controlClass = `${controlHeight} ${controlText} border-white/10 bg-slate-900/70 text-slate-100`;

  return (
    <div className="space-y-4 rounded-lg border border-white/5 bg-slate-900/55 p-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filters</h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-300 hover:bg-white/10 hover:text-cyan-200" onClick={() => onFiltersChange(emptyFilters)}>
          <X className="mr-1 h-3 w-3" /> Clear
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Event Name</Label>
        <Input className={controlClass} placeholder="e.g. AssumeRole" value={filters.eventName} onChange={(e) => set("eventName", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Event Source</Label>
        <Input className={controlClass} placeholder="e.g. s3.amazonaws.com" value={filters.eventSource} onChange={(e) => set("eventSource", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Username</Label>
        <Input className={controlClass} placeholder="e.g. admin" value={filters.username} onChange={(e) => set("username", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Resource Name</Label>
        <Input className={controlClass} placeholder="Filter by resource" value={filters.resourceName} onChange={(e) => set("resourceName", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Source IP</Label>
        <Input className={controlClass} placeholder="e.g. 10.0.0.1" value={filters.sourceIP} onChange={(e) => set("sourceIP", e.target.value)} />
      </div>

      {/* Dropdowns */}
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Resource Type</Label>
        <Select value={filters.resourceType || "all"} onValueChange={(v) => set("resourceType", v === "all" ? "" : v)}>
          <SelectTrigger className={controlClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueValues.resourceTypes.map((t) => <SelectItem key={t} value={t}>{t.split("::").pop()}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Region</Label>
        <Select value={filters.region || "all"} onValueChange={(v) => set("region", v === "all" ? "" : v)}>
          <SelectTrigger className={controlClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueValues.regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Boolean filters */}
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Read Only</Label>
        <Select value={filters.readOnly} onValueChange={(v: any) => set("readOnly", v)}>
          <SelectTrigger className={controlClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Error Code Exists</Label>
        <Select value={filters.errorExists} onValueChange={(v: any) => set("errorExists", v)}>
          <SelectTrigger className={controlClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date filters */}
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Date From</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn(`w-full justify-start border-white/10 bg-slate-900/70 ${controlText} ${controlHeight}`, !filters.dateFrom && "text-slate-500")}>
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={filters.dateFrom} onSelect={(d) => set("dateFrom", d)} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-300">Date To</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn(`w-full justify-start border-white/10 bg-slate-900/70 ${controlText} ${controlHeight}`, !filters.dateTo && "text-slate-500")}>
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={filters.dateTo} onSelect={(d) => set("dateTo", d)} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
