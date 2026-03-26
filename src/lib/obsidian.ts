import type { MarkdownFileSummary } from "@/lib/types";

function normalizeSlashes(value: string): string {
  return value.replaceAll("\\", "/").replace(/\/+/g, "/");
}

function normalizeForLookup(value: string): string {
  return normalizeSlashes(value).trim().replace(/^\/+/, "").toLowerCase();
}

function stripMarkdownExtension(value: string): string {
  return value.toLowerCase().endsWith(".md") ? value.slice(0, -3) : value;
}

function basename(value: string): string {
  const clean = normalizeSlashes(value).replace(/\/+$/, "");
  const parts = clean.split("/");
  return parts[parts.length - 1] || value;
}

export function buildWikiLookup(files: MarkdownFileSummary[]): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const file of files) {
    const normalizedPath = normalizeForLookup(file.path);
    const stemPath = stripMarkdownExtension(normalizedPath);
    const stemBase = stripMarkdownExtension(basename(normalizedPath));

    if (!lookup.has(stemPath)) {
      lookup.set(stemPath, file.path);
    }

    if (!lookup.has(stemBase)) {
      lookup.set(stemBase, file.path);
    }
  }

  return lookup;
}

function maybeResolveWikiTarget(rawTarget: string, lookup: Map<string, string>): string {
  const target = normalizeForLookup(rawTarget);
  const stem = stripMarkdownExtension(target);

  if (lookup.has(target)) {
    return lookup.get(target)!;
  }

  if (lookup.has(stem)) {
    return lookup.get(stem)!;
  }

  return target.endsWith(".md") ? target : `${target}.md`;
}

export function transformObsidianMarkdown(
  content: string,
  lookup: Map<string, string>,
): string {
  return content.replace(/!?\[\[([^\]]+)\]\]/g, (full, inner: string) => {
    const [rawTarget, rawLabel] = inner.split("|");
    const target = (rawTarget ?? "").trim();

    if (!target) {
      return full;
    }

    const resolvedTarget = maybeResolveWikiTarget(target, lookup);
    const label = (rawLabel ?? basename(target)).trim();

    if (full.startsWith("!")) {
      return `[${label}](${resolvedTarget})`;
    }

    return `[${label}](${resolvedTarget})`;
  });
}

export function resolveMarkdownLink(currentPath: string, href: string): string | null {
  const trimmed = href.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) || trimmed.startsWith("//")) {
    return null;
  }

  const [withoutQuery] = trimmed.split("?");
  const [targetPath] = withoutQuery.split("#");

  if (!targetPath) {
    return null;
  }

  const normalizedTarget = normalizeSlashes(targetPath);
  const currentSegments = normalizeSlashes(currentPath).split("/").filter(Boolean);

  if (currentSegments.length > 0) {
    currentSegments.pop();
  }

  let segments: string[];
  if (normalizedTarget.startsWith("/")) {
    segments = [];
  } else {
    segments = [...currentSegments];
  }

  for (const part of normalizedTarget.split("/")) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      segments.pop();
      continue;
    }

    segments.push(part);
  }

  if (segments.length === 0) {
    return null;
  }

  let resolved = segments.join("/");
  if (!resolved.toLowerCase().endsWith(".md")) {
    resolved = `${resolved}.md`;
  }

  return resolved;
}
