import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import slugify from "slugify";
import { revalidatePath } from "next/cache";
import { verifyPassword } from "../auth";

// GET /api/posts - list all posts (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    // Fetch all posts ordered by created_at DESC
    const result = await sql<Post[]>`SELECT id, title, slug, content, excerpt, cover_image, created_at, updated_at FROM posts ORDER BY created_at DESC`;

    let posts = result.rows;
    if (limit) {
      const limitNum = parseInt(limit);
      posts = posts.slice(0, limitNum);
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/posts - create a new post (admin protected)
export async function POST(request: NextRequest) {
  // Admin password check
  const providedPassword = request.headers.get("x-admin-password");
  if (!verifyPassword(providedPassword)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, content, excerpt, cover_image } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Generate slug from title
    let baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists, if so, append a number
    while (true) {
      const { rowCount } = await sql`SELECT id FROM posts WHERE slug = ${slug}`;
      if (rowCount === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // Insert post
    const result = await sql<Post>`INSERT INTO posts (title, slug, content, excerpt, cover_image) VALUES (${title}, ${slug}, ${content}, ${excerpt || null}, ${cover_image || null}) RETURNING *`;
    
    // Revalidate blog page cache
    revalidatePath("/blog");
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
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
