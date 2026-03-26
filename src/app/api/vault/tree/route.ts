import { fetchVaultTree } from "@/lib/github";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const payload = await fetchVaultTree();
    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json(
      {
        error: "Failed to fetch vault tree",
        details: message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
