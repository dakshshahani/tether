import type { MarkdownFileSummary, VaultFileNode, VaultFolderNode, VaultNode } from "@/lib/types";

interface MutableFolder {
  name: string;
  path: string;
  folders: Map<string, MutableFolder>;
  files: VaultFileNode[];
}

function createMutableFolder(name: string, path: string): MutableFolder {
  return {
    name,
    path,
    folders: new Map<string, MutableFolder>(),
    files: [],
  };
}

function sortByName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function toVaultNodes(folder: MutableFolder): VaultNode[] {
  const folders: VaultFolderNode[] = Array.from(folder.folders.values())
    .sort(sortByName)
    .map((child) => ({
      kind: "folder",
      name: child.name,
      path: child.path,
      children: toVaultNodes(child),
    }));

  const files: VaultFileNode[] = [...folder.files].sort(sortByName);

  return [...folders, ...files];
}

export function buildVaultTree(files: MarkdownFileSummary[]): VaultNode[] {
  const root = createMutableFolder("", "");
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const parts = file.path.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    const fileName = parts[parts.length - 1];
    let current = root;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      const nextPath = current.path ? `${current.path}/${part}` : part;
      const existingFolder = current.folders.get(part);

      if (existingFolder) {
        current = existingFolder;
        continue;
      }

      const newFolder = createMutableFolder(part, nextPath);
      current.folders.set(part, newFolder);
      current = newFolder;
    }

    current.files.push({
      kind: "file",
      name: fileName,
      path: file.path,
    });
  }

  return toVaultNodes(root);
}
