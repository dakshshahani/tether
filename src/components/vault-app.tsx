"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VaultFileResponse, VaultNode, VaultTreeResponse } from "@/lib/types";
import { buildWikiLookup, resolveMarkdownLink, transformObsidianMarkdown } from "@/lib/obsidian";

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
}: TreeBranchProps) {
  return (
    <ul className="list-none m-0 p-0" role={depth === 0 ? "tree" : "group"}>
      {nodes.map((node) => {
        if (node.kind === "folder") {
          const expanded = expandedFolders.has(node.path);

          return (
            <li key={node.path || "root"} role="treeitem" aria-expanded={expanded} aria-selected={false}>
              <button
                type="button"
                className="w-full border-0 bg-transparent text-left flex gap-1.5 items-center min-h-[30px] font-ibm-plex-mono text-[0.8rem] text-ink font-medium"
                style={{ paddingLeft: `${depth * 14 + 12}px` }}
                onClick={() => onToggleFolder(node.path)}
              >
                <span className="w-3.5 text-ink-soft" aria-hidden>
                  {expanded ? "▾" : "▸"}
                </span>
                <span>{node.name}</span>
              </button>
              {expanded ? (
                <TreeBranch
                  nodes={node.children}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onSelectFile={onSelectFile}
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
              className={`w-full border-0 bg-transparent text-left flex gap-1.5 items-center min-h-[30px] font-ibm-plex-mono text-[0.8rem] text-ink ${
                isSelected ? "bg-accent-soft/30 border-l-2 border-accent" : ""
              }`}
              style={{ paddingLeft: `${depth * 14 + 12}px` }}
              onClick={() => onSelectFile(node.path)}
            >
              <span className="w-3.5 text-ink-soft" aria-hidden>
                •
              </span>
              <span>{node.name}</span>
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

      setExpandedFolders((prev) => {
        if (prev.size > 0) {
          return prev;
        }

        const next = new Set<string>();
        for (const file of payload.files) {
          const segments = file.path.split("/");
          if (segments.length < 2) {
            continue;
          }
          let folderPath = "";
          for (let index = 0; index < segments.length - 1; index += 1) {
            folderPath = folderPath ? `${folderPath}/${segments[index]}` : segments[index];
            next.add(folderPath);
          }
        }
        return next;
      });

      setActivePath((prevPath) => {
        if (!prevPath && payload.files.length > 0) {
          return payload.files[0].path;
        }

        if (prevPath && !payload.files.some((file) => file.path === prevPath)) {
          setActiveFile(null);
          return payload.files[0]?.path ?? null;
        }

        return prevPath;
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

  useEffect(() => {
    if (!treeData || !activePath) {
      return;
    }

    openFile(activePath);
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

  const canRefresh = syncState === "idle";

  return (
    <div className="w-[min(1100px,calc(100%-1.25rem))] mx-auto my-3 md:mt-6 p-3.5 md:p-4 border border-line rounded-[20px] bg-surface/95 shadow-[0_30px_70px_-50px_rgb(25,48,68,0.7),0_4px_24px_-14px_rgba(0,0,0,0.3)]">
      <header className="flex justify-between gap-3 items-start px-1.5 pt-2 pb-4">
        <div>
          <p className="m-0 uppercase tracking-[0.16em] text-[0.66rem] text-ink-soft font-ibm-plex-mono">
            Tether Vault
          </p>
          <h1 className="my-1 text-[clamp(1.2rem,2.4vw,1.6rem)] leading-tight">
            {treeData?.repository ?? "GitHub Vault"}
          </h1>
          <p className="m-0 text-ink-soft text-[0.84rem]">
            Auto-sync on open + foreground. Private repo only.
          </p>
        </div>
        <button
          type="button"
          className="appearance-none border border-accent/50 bg-gradient-to-b from-[#22435f] to-accent text-white font-ibm-plex-mono text-[0.8rem] rounded-full py-2 px-3.5 min-w-[108px] disabled:opacity-70"
          onClick={onRefresh}
          disabled={!canRefresh}
        >
          {syncState === "idle" ? "Pull latest" : "Syncing..."}
        </button>
      </header>

      {treeError ? (
        <p className="text-error font-ibm-plex-mono text-[0.78rem] my-1.5">
          Could not load vault: {treeError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-3.5">
        <aside className="border border-line rounded-[14px] bg-surface-strong/95 p-2 px-1 max-h-[40vh] md:max-h-[calc(100vh-180px)] overflow-auto">
          <div className="flex justify-between items-baseline gap-3 px-2.5 pb-2">
            <h2 className="m-0 text-[0.88rem] uppercase tracking-wider font-ibm-plex-mono">
              Files
            </h2>
            <p className="m-0 text-ink-soft font-ibm-plex-mono text-[0.7rem]">
              {treeData?.files.length ?? 0} markdown notes
            </p>
          </div>

          {syncState === "loading" && !treeData ? <p>Loading your vault...</p> : null}

          {treeData ? (
            <TreeBranch
              nodes={treeData.tree}
              depth={0}
              selectedPath={activePath}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onSelectFile={onSelectFile}
            />
          ) : null}
        </aside>

        <main className="border border-line rounded-[14px] bg-surface-strong/95 min-h-[60vh] md:min-h-[calc(100vh-180px)] p-3 overflow-auto">
          <div className="border-b border-dashed border-line pb-2.5 mb-3.5">
            <h2 className="m-0 text-[0.88rem] uppercase tracking-wider font-ibm-plex-mono">
              {activeFile?.path || "Choose a markdown file"}
            </h2>
            <p className="m-0 text-ink-soft font-ibm-plex-mono text-[0.7rem]">
              {activeFile?.syncedAt ? `Synced ${new Date(activeFile.syncedAt).toLocaleString()}` : ""}
            </p>
          </div>

          {loadingFile ? <p>Loading markdown...</p> : null}
          {fileError ? <p className="text-error font-ibm-plex-mono text-[0.78rem]">{fileError}</p> : null}

          {!loadingFile && !fileError && activeFile ? (
            <article className="prose-vault">
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
                          className="border-0 bg-transparent text-accent underline p-0 font-[inherit] cursor-pointer"
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
        </main>
      </div>
    </div>
  );
}
