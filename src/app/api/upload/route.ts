import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyPassword } from "../auth";

export async function POST(request: NextRequest) {
  // Admin password check
  const providedPassword = request.headers.get("x-admin-password");
  if (!verifyPassword(providedPassword)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate a unique filename: timestamp-original
    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const blob = await put(filename, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
