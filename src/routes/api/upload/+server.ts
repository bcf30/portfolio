import type { RequestHandler } from "./$types";
import { put } from "@vercel/blob";
import { BLOB_READ_WRITE_TOKEN } from "$app/env/private";
import { requireAdmin } from "#lib/server/auth.ts";

// POST /api/upload - store a cover image in Vercel Blob (admin protected)
export const POST: RequestHandler = async ({ request }) => {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    // Timestamp prefix keeps re-uploads of the same filename from colliding
    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const blob = await put(filename, file, { access: "public", token: BLOB_READ_WRITE_TOKEN });
    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
};
