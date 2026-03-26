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
    <ul className="vault-tree-list" role={depth === 0 ? "tree" : "group"}>
      {nodes.map((node) => {
        if (node.kind === "folder") {
          const expanded = expandedFolders.has(node.path);

          return (
            <li key={node.path || "root"} role="treeitem" aria-expanded={expanded} aria-selected={false}>
              <button
                type="button"
                className="vault-tree-row vault-folder-row"
                style={{ paddingLeft: `${depth * 14 + 12}px` }}
                onClick={() => onToggleFolder(node.path)}
              >
                <span className="vault-icon" aria-hidden>
                  {expanded ? "▾" : "▸"}
                </span>
                <span className="vault-folder">{node.name}</span>
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
              className={`vault-tree-row vault-file-row${isSelected ? " selected" : ""}`}
              style={{ paddingLeft: `${depth * 14 + 12}px` }}
              onClick={() => onSelectFile(node.path)}
            >
              <span className="vault-icon" aria-hidden>
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
    <div className="vault-app-shell">
      <header className="vault-header">
        <div>
          <p className="vault-kicker">Tether Vault</p>
          <h1>{treeData?.repository ?? "GitHub Vault"}</h1>
          <p className="vault-subtle">
            Auto-sync on open + foreground. Private repo only.
          </p>
        </div>
        <button type="button" className="vault-refresh" onClick={onRefresh} disabled={!canRefresh}>
          {syncState === "idle" ? "Pull latest" : "Syncing..."}
        </button>
      </header>

      {treeError ? <p className="vault-error">Could not load vault: {treeError}</p> : null}

      <div className="vault-layout">
        <aside className="vault-sidebar">
          <div className="vault-sidebar-head">
            <h2>Files</h2>
            <p>{treeData?.files.length ?? 0} markdown notes</p>
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

        <main className="vault-main">
          <div className="vault-main-head">
            <h2>{activeFile?.path || "Choose a markdown file"}</h2>
            <p>{activeFile?.syncedAt ? `Synced ${new Date(activeFile.syncedAt).toLocaleString()}` : ""}</p>
          </div>

          {loadingFile ? <p>Loading markdown...</p> : null}
          {fileError ? <p className="vault-error">{fileError}</p> : null}

          {!loadingFile && !fileError && activeFile ? (
            <article className="vault-markdown">
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
                          className="vault-md-link"
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
