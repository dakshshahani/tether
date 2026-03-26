"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VaultFileResponse, VaultNode, VaultTreeResponse } from "@/lib/types";
import { buildWikiLookup, resolveMarkdownLink, transformObsidianMarkdown } from "@/lib/obsidian";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchDialog, SearchDialogContent, SearchDialogHeader, SearchDialogBody } from "@/components/ui/search-dialog";

interface ApiErrorPayload {
  error?: string;
  details?: string;
}

type SyncState = "idle" | "loading" | "refreshing";

interface TreeBranchProps {
  nodes: VaultNode[];
  depth: number;
  selectedPath: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  onClose: () => void;
}

function statusMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.details || payload.error || response.statusText;
  } catch {
    return response.statusText;
  }
}

function TreeBranch({
  nodes,
  depth,
  selectedPath,
  expandedFolders,
  onToggleFolder,
  onSelectFile,
  onClose,
}: TreeBranchProps) {
  return (
    <ul className="list-none m-0 p-0">
      {nodes.map((node) => {
        if (node.kind === "folder") {
          const expanded = expandedFolders.has(node.path);

          return (
            <li key={node.path || "root"} role="treeitem" aria-expanded={expanded} aria-selected={false}>
              <button
                type="button"
                className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50 transition-all text-sm group"
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                onClick={() => onToggleFolder(node.path)}
              >
                <span className="text-muted-foreground text-xs transition-transform group-hover:scale-110">
                  {expanded ? "📂" : "📁"}
                </span>
                <span className="font-medium">{node.name}</span>
              </button>
              {expanded ? (
                <TreeBranch
                  nodes={node.children}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onSelectFile={onSelectFile}
                  onClose={onClose}
                />
              ) : null}
            </li>
          );
        }

        const isSelected = selectedPath === node.path;
        return (
          <li key={node.path} role="treeitem" aria-selected={isSelected}>
            <button
              type="button"
              className={`w-full text-left flex items-center gap-2 py-2 px-3 rounded-md transition-all text-sm ${
                isSelected 
                  ? "bg-accent font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] border-l-2 border-foreground" 
                  : "hover:bg-accent/30"
              }`}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
              onClick={() => {
                onSelectFile(node.path);
                onClose();
              }}
            >
              <span className="text-muted-foreground text-xs">📄</span>
              <span className="truncate">{node.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function VaultApp() {
  const [treeData, setTreeData] = useState<VaultTreeResponse | null>(null);
  const [activeFile, setActiveFile] = useState<VaultFileResponse | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [treeError, setTreeError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ path: string; name: string; content: string; matches: number }>>([]);

  const markdownPaths = useMemo(() => {
    return new Set((treeData?.files ?? []).map((item) => item.path));
  }, [treeData]);

  const markdownPathLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of treeData?.files ?? []) {
      map.set(item.path.toLowerCase(), item.path);
    }
    return map;
  }, [treeData]);

  const wikiLookup = useMemo(() => {
    return buildWikiLookup(treeData?.files ?? []);
  }, [treeData]);

  const renderedMarkdown = useMemo(() => {
    if (!activeFile) {
      return "";
    }

    return transformObsidianMarkdown(activeFile.content, wikiLookup);
  }, [activeFile, wikiLookup]);

  const fetchTree = useCallback(async (reason: "initial" | "refresh") => {
    setTreeError(null);
    setSyncState((prev) => {
      if (reason === "refresh" || prev === "refreshing") {
        return "refreshing";
      }
      return "loading";
    });

    try {
      const response = await fetch("/api/vault/tree", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const payload = (await response.json()) as VaultTreeResponse;
      setTreeData(payload);

      // Don't auto-expand folders - start collapsed
      setExpandedFolders((prev) => {
        // Keep existing expanded folders if user has interacted
        if (prev.size > 0) {
          return prev;
        }
        // Start with all folders collapsed
        return new Set<string>();
      });
    } catch (error) {
      setTreeError(statusMessage(error));
    } finally {
      setSyncState("idle");
    }
  }, []);

  const openFile = useCallback(async (path: string) => {
    setLoadingFile(true);
    setFileError(null);

    try {
      const response = await fetch(`/api/vault/file?path=${encodeURIComponent(path)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const payload = (await response.json()) as VaultFileResponse;
      setActiveFile(payload);
    } catch (error) {
      setFileError(statusMessage(error));
    } finally {
      setLoadingFile(false);
    }
  }, []);

  useEffect(() => {
    fetchTree("initial");
  }, [fetchTree]);

  // Load last opened note from localStorage on mount
  useEffect(() => {
    if (!treeData) {
      return;
    }

    const savedPath = localStorage.getItem("lastOpenedNotePath");
    if (savedPath && treeData.files.some((file) => file.path === savedPath)) {
      setActivePath(savedPath);
    } else if (treeData.files.length > 0) {
      // Fallback to first file if no saved path or saved path doesn't exist
      setActivePath(treeData.files[0].path);
    } else {
      setActivePath(null);
    }
  }, [treeData]);

  useEffect(() => {
    if (!treeData || !activePath) {
      return;
    }

    openFile(activePath);
    // Save to localStorage whenever a note is opened
    localStorage.setItem("lastOpenedNotePath", activePath);
  }, [activePath, openFile, treeData]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      fetchTree("refresh");
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchTree]);

  const onSelectFile = useCallback((path: string) => {
    setActivePath(path);
  }, []);

  const onToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const onRefresh = useCallback(() => {
    fetchTree("refresh");
  }, [fetchTree]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !treeData) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results: Array<{ path: string; name: string; content: string; matches: number }> = [];

    // Search through all files
    for (const file of treeData.files) {
      try {
        const response = await fetch(`/api/vault/file?path=${encodeURIComponent(file.path)}`, {
          cache: "no-store",
        });
        
        if (response.ok) {
          const fileData = (await response.json()) as VaultFileResponse;
          const content = fileData.content.toLowerCase();
          
          // Count matches
          const matches = (content.match(new RegExp(lowerQuery, 'g')) || []).length;
          
          if (matches > 0) {
            // Get a snippet with the match
            const index = content.indexOf(lowerQuery);
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + lowerQuery.length + 50);
            const snippet = fileData.content.substring(start, end);
            
            results.push({
              path: file.path,
              name: file.name,
              content: snippet,
              matches,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to search file ${file.path}:`, error);
      }
    }

    // Sort by number of matches
    results.sort((a, b) => b.matches - a.matches);
    setSearchResults(results);
  }, [treeData]);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Search when query changes
  useEffect(() => {
    if (searchOpen && searchQuery) {
      const timer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300); // Debounce 300ms

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchOpen, performSearch]);

  const canRefresh = syncState === "idle";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with skeumorphic design */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </Button>
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold tracking-tight">{treeData?.repository ?? "Vault"}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Button>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={!canRefresh}
              className="text-sm gap-2"
            >
              {syncState === "idle" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {syncState === "idle" ? "Sync" : "Syncing..."}
            </Button>
          </div>
        </div>
      </header>

      {treeError ? (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900">
          <p className="text-sm text-red-800 dark:text-red-200">Could not load vault: {treeError}</p>
        </div>
      ) : null}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar - Skeumorphic */}
        <aside className="hidden lg:block w-72 border-r border-border overflow-y-auto bg-card shadow-[inset_-1px_0_2px_rgba(0,0,0,0.05)]">
          <div className="p-4">
            <div className="mb-6 pb-4 border-b border-border">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Files
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-medium shadow-sm">
                  {treeData?.files.length ?? 0}
                </span>
                <span>notes</span>
              </p>
            </div>

            {syncState === "loading" && !treeData ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Loading...
              </div>
            ) : null}

            {treeData ? (
              <div className="space-y-1">
                <TreeBranch
                  nodes={treeData.tree}
                  depth={0}
                  selectedPath={activePath}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onSelectFile={onSelectFile}
                  onClose={() => {}}
                />
              </div>
            ) : null}
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          {sidebarOpen ? (
            <SheetContent side="left">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>Files</SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </SheetHeader>
              
              <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 80px)" }}>
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                    {treeData?.files.length ?? 0}
                  </span>
                  <span>notes</span>
                </p>

                {treeData ? (
                  <div className="space-y-1">
                    <TreeBranch
                      nodes={treeData.tree}
                      depth={0}
                      selectedPath={activePath}
                      expandedFolders={expandedFolders}
                      onToggleFolder={onToggleFolder}
                      onSelectFile={onSelectFile}
                      onClose={() => setSidebarOpen(false)}
                    />
                  </div>
                ) : null}
              </div>
            </SheetContent>
          ) : null}
        </Sheet>

        {/* Main Content - Paper-like texture */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:px-12">
            {loadingFile ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Loading...
              </div>
            ) : null}
            
            {fileError ? (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-800 dark:text-red-200">{fileError}</p>
              </div>
            ) : null}

            {!loadingFile && !fileError && activeFile ? (
              <article className="prose animate-fade-in bg-card rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] border border-border">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children, ...props }) => {
                      const currentPath = activeFile.path;
                      const target = href ?? "";
                      const resolved = resolveMarkdownLink(currentPath, target);

                      const resolvedPath = resolved ? markdownPathLookup.get(resolved.toLowerCase()) ?? null : null;

                      if (resolvedPath && markdownPaths.has(resolvedPath)) {
                        return (
                          <button
                            type="button"
                            className="text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground cursor-pointer bg-transparent border-0 p-0 font-inherit transition-all"
                            onClick={() => onSelectFile(resolvedPath)}
                          >
                            {children}
                          </button>
                        );
                      }

                      return (
                        <a {...props} href={href} target="_blank" rel="noreferrer">
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {renderedMarkdown}
                </ReactMarkdown>
              </article>
            ) : null}
          </div>
        </main>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <SearchDialogContent>
          <SearchDialogHeader>
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-lg placeholder:text-muted-foreground"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </SearchDialogHeader>
          
          <SearchDialogBody>
            {searchQuery && searchResults.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No results found for "{searchQuery}"</p>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="divide-y divide-border">
                {searchResults.map((result) => (
                  <button
                    key={result.path}
                    onClick={() => {
                      onSelectFile(result.path);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full text-left p-4 hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground flex-shrink-0">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                        </svg>
                        <span className="font-medium text-sm truncate group-hover:text-accent-foreground">
                          {result.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {result.matches} {result.matches === 1 ? 'match' : 'matches'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                      ...{result.content}...
                    </p>
                  </button>
                ))}
              </div>
            )}
            
            {!searchQuery && (
              <div className="p-8 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-muted-foreground">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <p className="text-sm text-muted-foreground mb-1">Search through all your notes</p>
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">⌘K</kbd> to open
                </p>
              </div>
            )}
          </SearchDialogBody>
        </SearchDialogContent>
      </SearchDialog>
    </div>
  );
}
