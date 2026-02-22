import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadSettings } from "@/services/api";
import { fetchFolders, fetchEvents } from "@/services/api";
import { CloudTrailEvent, FolderNode, Filters, emptyFilters, SortField, SortDirection } from "@/types/cloudtrail";
import { FolderTree } from "@/components/cloudtrail/FolderTree";
import { EventTable } from "@/components/cloudtrail/EventTable";
import { FilterSidebar } from "@/components/cloudtrail/FilterSidebar";
import { Dashboard } from "@/components/cloudtrail/Dashboard";
import { TopBar } from "@/components/cloudtrail/TopBar";
import { toast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";

const Explorer = () => {
  const navigate = useNavigate();
  const settings = loadSettings();

  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [events, setEvents] = useState<CloudTrailEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("eventTime");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [view, setView] = useState<"table" | "dashboard">("table");
  const [folderSidebarOpen, setFolderSidebarOpen] = useState(true);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const rootFolders = await loadFolders("/");
      if (rootFolders.length === 0) {
        handleSelectDay("/", ["root"]);
      }
    };
    void bootstrap();
  }, []);

  const loadFolders = async (prefix: string) => {
    try {
      const res = await fetchFolders(settings, prefix);
      if (prefix === "/") {
        setFolders(res.folders);
      }
      return res.folders;
    } catch (err: any) {
      toast({ title: "Error loading folders", description: err.message, variant: "destructive" });
      return [];
    }
  };

  const handleSelectDay = useCallback(async (prefix: string, crumbs: string[]) => {
    setSelectedPrefix(prefix);
    setBreadcrumb(crumbs);
    setPage(1);
    setLoading(true);
    try {
      const res = await fetchEvents(settings, prefix, 1, pageSize);
      setEvents(res.events);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      toast({ title: "Error loading events", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [settings, pageSize]);

  const handlePageChange = useCallback(async (newPage: number) => {
    setPage(newPage);
    setLoading(true);
    try {
      const res = await fetchEvents(settings, selectedPrefix, newPage, pageSize);
      setEvents(res.events);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [settings, selectedPrefix, pageSize]);

  const handleSort = useCallback((field: SortField) => {
    setSortDir((d) => (sortField === field ? (d === "asc" ? "desc" : "asc") : "desc"));
    setSortField(field);
  }, [sortField]);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Apply text filters
    if (filters.eventName) result = result.filter((e) => e.eventName.toLowerCase().includes(filters.eventName.toLowerCase()));
    if (filters.eventSource) result = result.filter((e) => e.eventSource.toLowerCase().includes(filters.eventSource.toLowerCase()));
    if (filters.username) result = result.filter((e) => e.username.toLowerCase().includes(filters.username.toLowerCase()));
    if (filters.resourceName) result = result.filter((e) => e.resourceName.toLowerCase().includes(filters.resourceName.toLowerCase()));
    if (filters.sourceIP) result = result.filter((e) => e.sourceIPAddress.toLowerCase().includes(filters.sourceIP.toLowerCase()));
    if (filters.resourceType) result = result.filter((e) => e.resourceType === filters.resourceType);
    if (filters.accountId) result = result.filter((e) => e.accountId === filters.accountId);
    if (filters.region) result = result.filter((e) => e.awsRegion === filters.region);
    if (filters.readOnly === "yes") result = result.filter((e) => e.readOnly);
    if (filters.readOnly === "no") result = result.filter((e) => !e.readOnly);
    if (filters.errorExists === "yes") result = result.filter((e) => !!e.errorCode);
    if (filters.errorExists === "no") result = result.filter((e) => !e.errorCode);
    if (filters.dateFrom) result = result.filter((e) => new Date(e.eventTime) >= filters.dateFrom!);
    if (filters.dateTo) result = result.filter((e) => new Date(e.eventTime) <= filters.dateTo!);

    // Global search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        Object.values(e).some((v) => typeof v === "string" && v.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField] as string;
      const bVal = b[sortField] as string;
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [events, filters, search, sortField, sortDir]);

  const uniqueValues = useMemo(() => ({
    resourceTypes: [...new Set(events.map((e) => e.resourceType))],
    accountIds: [...new Set(events.map((e) => e.accountId))],
    regions: [...new Set(events.map((e) => e.awsRegion))],
  }), [events]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <TopBar
          breadcrumb={breadcrumb}
          totalCount={filteredEvents.length}
          search={search}
          onSearchChange={setSearch}
          view={view}
          onViewChange={setView}
          events={filteredEvents}
          onToggleFolders={() => setFolderSidebarOpen((v) => !v)}
          onToggleFilters={() => setFilterSidebarOpen((v) => !v)}
          onSettings={() => navigate("/settings")}
        />
        <div className="flex flex-1 overflow-hidden">
          {folderSidebarOpen && (
            <div className="w-64 shrink-0 overflow-y-auto border-r bg-sidebar p-3">
              <FolderTree
                initialFolders={folders}
                onSelectDay={handleSelectDay}
                loadChildren={loadFolders}
              />
            </div>
          )}
          {view === "table" && filterSidebarOpen && events.length > 0 && (
            <div className="w-64 shrink-0 overflow-y-auto border-r bg-sidebar p-3">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                uniqueValues={uniqueValues}
              />
            </div>
          )}
          <main className="flex-1 overflow-y-auto p-4">
            {view === "table" ? (
              <EventTable
                events={filteredEvents}
                loading={loading}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                selectedPrefix={selectedPrefix}
              />
            ) : (
              <Dashboard events={filteredEvents} />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Explorer;
