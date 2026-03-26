import { parse as parseYaml } from "yaml";

export interface Frontmatter {
  date?: string;
  tags?: string[];
  author?: string;
  title?: string;
  [key: string]: unknown;
}

export interface ParsedContent {
  frontmatter: Frontmatter | null;
  content: string;
}

/**
 * Extracts and parses YAML frontmatter from markdown content.
 * Supports both standard YAML and Obsidian-style properties with double colons (::).
 * 
 * @param markdown - The raw markdown content
 * @returns Object containing parsed frontmatter and remaining content
 */
export function parseFrontmatter(markdown: string): ParsedContent {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: null,
      content: markdown,
    };
  }

  const rawFrontmatter = match[1];
  const content = markdown.slice(match[0].length);

  try {
    // Convert Obsidian-style properties (date:: value) to standard YAML (date: value)
    const normalizedYaml = rawFrontmatter.replace(/^(\s*)(\w+)::/gm, "$1$2:");

    const parsed = parseYaml(normalizedYaml) as Frontmatter;

    return {
      frontmatter: parsed || null,
      content,
    };
  } catch (error) {
    console.error("Failed to parse frontmatter:", error);
    return {
      frontmatter: null,
      content: markdown,
    };
  }
}

/**
 * Formats frontmatter metadata for display.
 * 
 * @param frontmatter - The parsed frontmatter object
 * @returns Formatted string for display
 */
export function formatFrontmatterDisplay(frontmatter: Frontmatter | null): {
  date?: string;
  tags?: string;
  author?: string;
  title?: string;
} | null {
  if (!frontmatter) {
    return null;
  }

  const display: Record<string, string> = {};

  if (frontmatter.date) {
    display.date = String(frontmatter.date);
  }

  if (frontmatter.tags) {
    // Handle both array and string formats
    if (Array.isArray(frontmatter.tags)) {
      display.tags = frontmatter.tags.join(", ");
    } else {
      display.tags = String(frontmatter.tags);
    }
  }

  if (frontmatter.author) {
    display.author = String(frontmatter.author);
  }

  if (frontmatter.title) {
    display.title = String(frontmatter.title);
  }

  return Object.keys(display).length > 0 ? display : null;
}
