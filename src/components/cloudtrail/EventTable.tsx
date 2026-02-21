import { useState } from "react";
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

export function EventTable({ events, loading, page, pageSize, totalCount, onPageChange, sortField, sortDir, onSort, selectedPrefix }: EventTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize);

  if (!selectedPrefix) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileJson className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Select a Day</h2>
        <p className="mt-1 text-sm text-muted-foreground">Expand the folder tree and click a day to load CloudTrail events</p>
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
        <FileJson className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold">No Events Found</h2>
        <p className="mt-1 text-sm text-muted-foreground">No logs match your current filters for this day</p>
      </div>
    );
  }

  const sortable = (field: SortField, label: string) => (
    <button onClick={() => onSort(field)} className="inline-flex items-center hover:text-foreground">
      {label}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>{sortable("eventTime", "Event Time")}</TableHead>
              <TableHead>{sortable("eventName", "Event Name")}</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>{sortable("username", "Username")}</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Source IP</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Read Only</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((evt) => (
              <>
                <TableRow
                  key={evt.eventId}
                  className={cn("cursor-pointer", expandedId === evt.eventId && "bg-muted/50")}
                  onClick={() => setExpandedId(expandedId === evt.eventId ? null : evt.eventId)}
                >
                  <TableCell>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", expandedId === evt.eventId && "rotate-90")} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(evt.eventTime).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">
                    {evt.eventName}
                    {evt.errorCode && <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">{evt.errorCode}</span>}
                  </TableCell>
                  <TableCell className="text-xs">{evt.eventSource}</TableCell>
                  <TableCell className="text-xs">{evt.username}</TableCell>
                  <TableCell className="text-xs">{evt.awsRegion}</TableCell>
                  <TableCell className="text-xs">{evt.sourceIPAddress}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-xs" title={evt.resourceName}>{evt.resourceName}</TableCell>
                  <TableCell className="text-xs">{evt.readOnly ? "Yes" : "No"}</TableCell>
                </TableRow>
                {expandedId === evt.eventId && (
                  <TableRow key={`${evt.eventId}-detail`}>
                    <TableCell colSpan={9} className="bg-muted/30 p-4">
                      <JsonViewer data={evt.rawEvent} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} events
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
