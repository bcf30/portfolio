import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { verifyPassword } from "../../auth";

// GET /api/posts/[slug] - fetch a single post by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const result = await sql<Post[]>`SELECT * FROM posts WHERE slug = ${slug}`;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("GET /api/posts/[slug] error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

// PUT /api/posts/[slug] - update a post (admin protected)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Admin password check
  const providedPassword = request.headers.get("x-admin-password");
  if (!verifyPassword(providedPassword)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const { title, content, excerpt, cover_image } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Update the post
    const result = await sql<Post>`UPDATE posts SET title = ${title}, content = ${content}, excerpt = ${excerpt || null}, cover_image = ${cover_image || null}, updated_at = NOW() WHERE slug = ${slug} RETURNING *`;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    
    // Revalidate blog page cache
    revalidatePath("/blog");
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /api/posts/[slug] error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE /api/posts/[slug] - delete a post (admin protected)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Admin password check
  const providedPassword = request.headers.get("x-admin-password");
  if (!verifyPassword(providedPassword)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const result = await sql`DELETE FROM posts WHERE slug = ${slug} RETURNING *`;
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    
    // Revalidate blog page cache
    revalidatePath("/blog");
    
    return NextResponse.json({ message: "Post deleted" });
  } catch (error) {
    console.error("DELETE /api/posts/[slug] error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  created_at: Date;
  updated_at: Date;
}
