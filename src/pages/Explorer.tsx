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
import { logout } from "@/services/auth";

const Explorer = () => {
  const navigate = useNavigate();
  const settings = loadSettings();

  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [events, setEvents] = useState<CloudTrailEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("eventTime");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [view, setView] = useState<"table" | "dashboard">("table");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
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

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [navigate]);

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
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/25 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
        </div>
        <TopBar
          breadcrumb={breadcrumb}
          totalCount={filteredEvents.length}
          search={search}
          onSearchChange={setSearch}
          view={view}
          onViewChange={setView}
          density={density}
          onDensityChange={setDensity}
          events={filteredEvents}
          onToggleFolders={() => setFolderSidebarOpen((v) => !v)}
          onToggleFilters={() => setFilterSidebarOpen((v) => !v)}
          onSettings={() => navigate("/settings")}
          onLogout={handleLogout}
        />
        <div className="relative z-10 mx-3 mb-3 flex flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur">
          {folderSidebarOpen && (
            <div className="m-3 mr-0 w-64 shrink-0 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/65 p-3 shadow-inner shadow-cyan-400/5 backdrop-blur">
              <FolderTree
                initialFolders={folders}
                onSelectDay={handleSelectDay}
                loadChildren={loadFolders}
                density={density}
              />
            </div>
          )}
          {view === "table" && filterSidebarOpen && events.length > 0 && (
            <div className="m-3 ml-0 mr-0 w-64 shrink-0 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/65 p-3 shadow-inner shadow-cyan-400/5 backdrop-blur">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                uniqueValues={uniqueValues}
                density={density}
              />
            </div>
          )}
          <main className="relative z-10 flex-1 overflow-y-auto p-3 pr-4">
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
                density={density}
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
