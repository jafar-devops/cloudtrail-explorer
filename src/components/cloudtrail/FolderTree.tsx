import { useState, useCallback } from "react";
import { FolderNode } from "@/types/cloudtrail";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderTreeProps {
  initialFolders: FolderNode[];
  onSelectDay: (prefix: string, breadcrumb: string[]) => void;
  loadChildren: (prefix: string) => Promise<FolderNode[]>;
  density: "comfortable" | "compact";
}

interface TreeNodeProps {
  node: FolderNode;
  depth: number;
  path: string[];
  onSelectDay: (prefix: string, breadcrumb: string[]) => void;
  loadChildren: (prefix: string) => Promise<FolderNode[]>;
  density: "comfortable" | "compact";
}

function TreeNode({ node, depth, path, onSelectDay, loadChildren, density }: TreeNodeProps) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<FolderNode[]>(node.children || []);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPath = [...path, node.name];
  const isDay = node.type === "day";

  const handleToggle = useCallback(async () => {
    if (isDay) {
      onSelectDay(node.prefix, currentPath);
      return;
    }

    if (!loaded && !loading) {
      setLoading(true);
      try {
        const res = await loadChildren(node.prefix);
        setChildren(res);
        setLoaded(true);

        // Treat leaf folders as a selectable day-like node for non-standard layouts.
        if (res.length === 0) {
          onSelectDay(node.prefix, currentPath);
          return;
        }
      } finally {
        setLoading(false);
      }
    }

    setOpen((v) => !v);
  }, [isDay, loaded, loading, node.prefix, onSelectDay, currentPath, loadChildren]);

  const Icon = isDay ? Calendar : open ? FolderOpen : Folder;
  const rowHeight = density === "compact" ? "py-1 text-[11px]" : "py-1.5 text-sm";

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          `flex w-full items-center gap-1.5 rounded-md px-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-cyan-200 ${rowHeight}`,
          isDay && "font-medium"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {!isDay && (
          open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        )}
        <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
        <span className="truncate">{node.name}</span>
        {loading && <span className="ml-auto text-xs text-slate-500">...</span>}
      </button>
      {open && children.map((child) => (
        <TreeNode key={child.prefix} node={child} depth={depth + 1} path={currentPath} onSelectDay={onSelectDay} loadChildren={loadChildren} density={density} />
      ))}
    </div>
  );
}

export function FolderTree({ initialFolders, onSelectDay, loadChildren, density }: FolderTreeProps) {
  return (
    <div className="space-y-2 rounded-lg border border-white/5 bg-slate-900/55 p-2">
      <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Folders</h3>
      {initialFolders.length === 0 && (
        <p className="px-2 text-sm text-slate-400">No folders found. Connect to a bucket first.</p>
      )}
      {initialFolders.map((node) => (
        <TreeNode key={node.prefix} node={node} depth={0} path={[]} onSelectDay={onSelectDay} loadChildren={loadChildren} density={density} />
      ))}
    </div>
  );
}
