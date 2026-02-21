import { useState, useCallback } from "react";
import { FolderNode } from "@/types/cloudtrail";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderTreeProps {
  initialFolders: FolderNode[];
  onSelectDay: (prefix: string, breadcrumb: string[]) => void;
  loadChildren: (prefix: string) => Promise<FolderNode[]>;
}

interface TreeNodeProps {
  node: FolderNode;
  depth: number;
  path: string[];
  onSelectDay: (prefix: string, breadcrumb: string[]) => void;
  loadChildren: (prefix: string) => Promise<FolderNode[]>;
}

function TreeNode({ node, depth, path, onSelectDay, loadChildren }: TreeNodeProps) {
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

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
          isDay && "font-medium"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {!isDay && (
          open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">{node.name}</span>
        {loading && <span className="ml-auto text-xs text-muted-foreground">...</span>}
      </button>
      {open && children.map((child) => (
        <TreeNode key={child.prefix} node={child} depth={depth + 1} path={currentPath} onSelectDay={onSelectDay} loadChildren={loadChildren} />
      ))}
    </div>
  );
}

export function FolderTree({ initialFolders, onSelectDay, loadChildren }: FolderTreeProps) {
  return (
    <div>
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Folders</h3>
      {initialFolders.length === 0 && (
        <p className="px-2 text-sm text-muted-foreground">No folders found. Connect to a bucket first.</p>
      )}
      {initialFolders.map((node) => (
        <TreeNode key={node.prefix} node={node} depth={0} path={[]} onSelectDay={onSelectDay} loadChildren={loadChildren} />
      ))}
    </div>
  );
}
