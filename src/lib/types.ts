export interface MarkdownFileSummary {
  name: string;
  path: string;
  size: number;
  sha: string;
}

export interface VaultFolderNode {
  kind: "folder";
  name: string;
  path: string;
  children: VaultNode[];
}

export interface VaultFileNode {
  kind: "file";
  name: string;
  path: string;
}

export type VaultNode = VaultFolderNode | VaultFileNode;

export interface VaultTreeResponse {
  repository: string;
  syncedAt: string;
  files: MarkdownFileSummary[];
  tree: VaultNode[];
}

export interface VaultFileResponse {
  path: string;
  sha: string;
  syncedAt: string;
  content: string;
}
