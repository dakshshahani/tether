import { fetchMarkdownFile } from "@/lib/github";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? "";

  if (!path) {
    return Response.json(
      { error: "Missing required query parameter: path" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const payload = await fetchMarkdownFile(path);
    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message.toLowerCase().includes("not found") ? 404 : 400;

    return Response.json(
      {
        error: "Failed to fetch markdown file",
        details: message,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
