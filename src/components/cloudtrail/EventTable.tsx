import { Fragment, useState } from "react";
import { CloudTrailEvent, SortField, SortDirection } from "@/types/cloudtrail";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventTableProps {
  events: CloudTrailEvent[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  sortField: SortField;
  sortDir: SortDirection;
  onSort: (field: SortField) => void;
  selectedPrefix: string;
  density: "comfortable" | "compact";
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDirection }) {
  if (field !== sortField) return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 text-muted-foreground" />;
  return sortDir === "asc" ? <ChevronUp className="ml-1 inline h-3.5 w-3.5" /> : <ChevronDown className="ml-1 inline h-3.5 w-3.5" />;
}

function JsonViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function EventTable({
  events,
  loading,
  page,
  pageSize,
  totalCount,
  onPageChange,
  sortField,
  sortDir,
  onSort,
  selectedPrefix,
  density,
}: EventTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize);
  const cellTextClass = density === "compact" ? "text-[11px]" : "text-xs";
  const rowClass = density === "compact" ? "h-8" : "h-10";

  if (!selectedPrefix) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileJson className="h-16 w-16 text-slate-600" />
        <h2 className="mt-4 text-lg font-semibold text-slate-100">Select a Day</h2>
        <p className="mt-1 text-sm text-slate-400">Expand the folder tree and click a day to load CloudTrail events</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileJson className="h-16 w-16 text-slate-600" />
        <h2 className="mt-4 text-lg font-semibold text-slate-100">No Events Found</h2>
        <p className="mt-1 text-sm text-slate-400">No logs match your current filters for this day</p>
      </div>
    );
  }

  const sortable = (field: SortField, label: string) => (
    <button onClick={() => onSort(field)} className="inline-flex items-center text-slate-200 hover:text-cyan-200">
      {label}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_12px_35px_rgba(0,0,0,0.35)] backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow className={cn("bg-slate-900/75", rowClass)}>
              <TableHead className="w-8 text-slate-300" />
              <TableHead>{sortable("eventTime", "Event Time")}</TableHead>
              <TableHead>{sortable("eventName", "Event Name")}</TableHead>
              <TableHead className="text-slate-300">Source</TableHead>
              <TableHead>{sortable("username", "Username")}</TableHead>
              <TableHead className="text-slate-300">Region</TableHead>
              <TableHead className="text-slate-300">Source IP</TableHead>
              <TableHead className="text-slate-300">Resource</TableHead>
              <TableHead className="text-slate-300">Read Only</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((evt) => (
              <Fragment key={evt.eventId}>
                <TableRow
                  className={cn(
                    "cursor-pointer border-slate-800/70 transition-colors hover:bg-slate-900/65",
                    rowClass,
                    expandedId === evt.eventId && "bg-slate-900/80"
                  )}
                  onClick={() => setExpandedId(expandedId === evt.eventId ? null : evt.eventId)}
                >
                  <TableCell>
                    <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", expandedId === evt.eventId && "rotate-90")} />
                  </TableCell>
                  <TableCell className={cn("whitespace-nowrap text-slate-300", cellTextClass)}>{new Date(evt.eventTime).toLocaleString()}</TableCell>
                  <TableCell className={cn("font-semibold text-slate-100", cellTextClass)}>
                    {evt.eventName}
                    {evt.errorCode && <span className="ml-2 rounded bg-rose-500/20 px-1.5 py-0.5 text-xs text-rose-300">{evt.errorCode}</span>}
                  </TableCell>
                  <TableCell className={cn("text-slate-300", cellTextClass)}>{evt.eventSource}</TableCell>
                  <TableCell className={cn("text-slate-300", cellTextClass)}>{evt.username}</TableCell>
                  <TableCell className={cn("text-slate-300", cellTextClass)}>{evt.awsRegion}</TableCell>
                  <TableCell className={cn("text-slate-300", cellTextClass)}>{evt.sourceIPAddress}</TableCell>
                  <TableCell className={cn("max-w-[150px] truncate text-slate-300", cellTextClass)} title={evt.resourceName}>{evt.resourceName}</TableCell>
                  <TableCell className={cn("text-slate-300", cellTextClass)}>{evt.readOnly ? "Yes" : "No"}</TableCell>
                </TableRow>
                {expandedId === evt.eventId && (
                  <TableRow key={`${evt.eventId}-detail`}>
                    <TableCell colSpan={9} className="bg-slate-900/75 p-4">
                      <JsonViewer data={evt.rawEvent} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className={cn(
        "flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/55 px-3 text-slate-300 shadow-[0_10px_25px_rgba(0,0,0,0.25)]",
        density === "compact" ? "py-1.5 text-xs" : "py-2 text-sm"
      )}>
        <span className="text-slate-400">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} events
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
          <span className="flex items-center px-2 text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
