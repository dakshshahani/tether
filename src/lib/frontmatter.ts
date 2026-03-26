import { parse as parseYaml } from "yaml";

export interface Frontmatter {
  date?: string;
  tags?: string[] | string;
  author?: string;
  title?: string;
  course?: string;
  links?: string;
  [key: string]: unknown;
}

export interface ParsedContent {
  frontmatter: Frontmatter | null;
  content: string;
}

/**
 * Extracts and parses frontmatter from markdown content.
 * Supports both:
 * 1. YAML frontmatter blocks (--- ... ---)
 * 2. Obsidian-style inline properties at the top (Key:: value)
 * 
 * @param markdown - The raw markdown content
 * @returns Object containing parsed frontmatter and remaining content
 */
export function parseFrontmatter(markdown: string): ParsedContent {
  // Try YAML frontmatter block first
  const yamlFrontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const yamlMatch = markdown.match(yamlFrontmatterRegex);

  if (yamlMatch) {
    const rawFrontmatter = yamlMatch[1];
    const content = markdown.slice(yamlMatch[0].length);

    try {
      // Convert Obsidian-style properties (Key:: value) to standard YAML (Key: value)
      const normalizedYaml = rawFrontmatter.replace(/^(\s*)(\w+)::/gm, "$1$2:");
      const parsed = parseYaml(normalizedYaml) as Frontmatter;

      return {
        frontmatter: parsed || null,
        content,
      };
    } catch (error) {
      console.error("Failed to parse YAML frontmatter:", error);
      return {
        frontmatter: null,
        content: markdown,
      };
    }
  }

  // Try Obsidian inline properties (Key:: value at the top of the file)
  const lines = markdown.split("\n");
  const properties: Record<string, string> = {};
  let propertyEndIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Stop if we hit an empty line or content that's not a property
    if (!line) {
      propertyEndIndex = i + 1; // Include the empty line
      break;
    }

    // Match property format: Key:: Value
    const propertyMatch = line.match(/^(\w+)::\s*(.*)$/);
    if (propertyMatch) {
      const [, key, value] = propertyMatch;
      properties[key.toLowerCase()] = value.trim();
      propertyEndIndex = i + 1;
    } else {
      // Stop if we hit a line that's not a property
      break;
    }
  }

  if (Object.keys(properties).length > 0) {
    // Remove property lines from content
    const content = lines.slice(propertyEndIndex).join("\n").trim();

    return {
      frontmatter: properties as unknown as Frontmatter,
      content: "\n" + content,
    };
  }

  // No frontmatter found
  return {
    frontmatter: null,
    content: markdown,
  };
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
  course?: string;
  links?: string;
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

  if (frontmatter.course) {
    display.course = String(frontmatter.course);
  }

  if (frontmatter.links) {
    display.links = String(frontmatter.links);
  }

  return Object.keys(display).length > 0 ? display : null;
}
