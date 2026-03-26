import { Octokit } from "octokit";
import type { MarkdownFileSummary, VaultFileResponse, VaultTreeResponse } from "@/lib/types";
import { buildVaultTree } from "@/lib/vault-tree";

type GithubBlobEncoding = "base64" | "utf-8";

interface GithubTreeEntry {
  path?: string;
  mode?: string;
  type?: "blob" | "tree" | "commit";
  size?: number;
  sha?: string;
  url?: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function decodeBlob(content: string, encoding: GithubBlobEncoding): string {
  if (encoding === "utf-8") {
    return content;
  }

  if (encoding !== "base64") {
    throw new Error(`Unsupported blob encoding: ${encoding}`);
  }

  return Buffer.from(content, "base64").toString("utf-8");
}

let octokitSingleton: Octokit | null = null;

export function getGithubClient(): Octokit {
  if (octokitSingleton) {
    return octokitSingleton;
  }

  const token = requireEnv("GITHUB_TOKEN");
  octokitSingleton = new Octokit({ auth: token });
  return octokitSingleton;
}

export function getVaultRepoConfig(): { owner: string; repo: string } {
  return {
    owner: requireEnv("GITHUB_OWNER"),
    repo: requireEnv("GITHUB_REPO"),
  };
}

export async function fetchVaultTree(): Promise<VaultTreeResponse> {
  const client = getGithubClient();
  const { owner, repo } = getVaultRepoConfig();

  const repoResponse = await client.rest.repos.get({ owner, repo });
  const branch = repoResponse.data.default_branch;

  const treeResponse = await client.rest.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "1",
  });

  const files: MarkdownFileSummary[] = (treeResponse.data.tree as GithubTreeEntry[])
    .filter((item) => item.type === "blob" && Boolean(item.path?.toLowerCase().endsWith(".md")))
    .map((item) => ({
      name: item.path!.split("/").pop() || item.path!,
      path: item.path!,
      size: item.size ?? 0,
      sha: item.sha ?? "",
    }));

  return {
    repository: `${owner}/${repo}`,
    syncedAt: new Date().toISOString(),
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    tree: buildVaultTree(files),
  };
}

export async function fetchMarkdownFile(path: string): Promise<VaultFileResponse> {
  if (!path || !path.toLowerCase().endsWith(".md")) {
    throw new Error("Only Markdown files are supported");
  }

  const client = getGithubClient();
  const { owner, repo } = getVaultRepoConfig();

  const response = await client.rest.repos.getContent({
    owner,
    repo,
    path,
  });

  if (Array.isArray(response.data)) {
    throw new Error("Requested path points to a directory, not a file");
  }

  if (response.data.type !== "file") {
    throw new Error("Requested path is not a regular file");
  }

  const encoding = (response.data.encoding ?? "base64") as GithubBlobEncoding;
  const content = decodeBlob(response.data.content ?? "", encoding);

  return {
    path,
    sha: response.data.sha,
    syncedAt: new Date().toISOString(),
    content,
  };
}
