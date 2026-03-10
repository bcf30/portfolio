"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AdminBlogPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState(""); // stored in memory for API calls
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", coverImage: "" });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch posts when authenticated
  useEffect(() => {
    if (!authenticated) return;
    fetchPosts();
  }, [authenticated]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For simplicity, any non-empty password is accepted; server will verify
    if (password.trim()) {
      setAdminPassword(password);
      setAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setAdminPassword("");
    setPassword("");
    setEditingSlug(null);
    setForm({ title: "", content: "", excerpt: "", coverImage: "" });
    setCoverFile(null);
  };

  const handleImageUpload = async () => {
    if (!coverFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", coverFile);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-password": adminPassword },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setForm(prev => ({ ...prev, coverImage: url }));
      setCoverFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = { ...form, cover_image: form.coverImage || null };
      const url = editingSlug ? `/api/posts/${editingSlug}` : "/api/posts";
      const method = editingSlug ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save post");
      }
      // Reset form and refresh
      setForm({ title: "", content: "", excerpt: "", coverImage: "" });
      setCoverFile(null);
      setEditingSlug(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchPosts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: any) => {
    setEditingSlug(post.slug);
    setForm({
      title: post.title || "",
      content: post.content || "",
      excerpt: post.excerpt || "",
      coverImage: post.cover_image || "",
    });
    // If there's a cover image, we don't set file; user can change if needed
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete post");
      }
      await fetchPosts();
      if (editingSlug === slug) {
        setEditingSlug(null);
        setForm({ title: "", content: "", excerpt: "", coverImage: "" });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.16_0.01_145)] relative">
        <header className="absolute top-0 left-0 z-40 p-3 flex gap-2">
          <Link href="/" style={{ borderColor: 'oklch(0.50 0.04 145)', color: 'oklch(0.75 0.03 145)' }} className="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all bg-[oklch(0.16_0.01_145)]">
            &larr; home
          </Link>
        </header>
        <form onSubmit={handleLogin} className="max-w-sm w-full p-6 border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.8)]">
          <h1 className="font-[family-name:var(--font-cormorant)] text-2xl text-[oklch(0.80_0.02_145)] mb-4">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full p-2 mb-4 bg-[oklch(0.16_0.01_145)] border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.75_0.03_145)] font-mono text-sm"
            required
          />
          <button type="submit" className="w-full px-4 py-2 border border-[oklch(0.45_0.10_145)] bg-[oklch(0.45_0.10_145)] text-[oklch(0.95_0.02_145)] text-xs font-mono hover:opacity-80 transition-all">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.16_0.01_145)] py-12 px-6 relative">
      <header className="absolute top-0 left-0 z-40 p-3 flex gap-2">
        <Link href="/" style={{ borderColor: 'oklch(0.50 0.04 145)', color: 'oklch(0.75 0.03 145)' }} className="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all bg-[oklch(0.16_0.01_145)]">
          &larr; home
        </Link>
      </header>
      <div className="max-w-4xl mx-auto mt-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-[family-name:var(--font-cormorant)] text-3xl text-[oklch(0.80_0.02_145)]">Blog Admin</h1>
          <button onClick={handleLogout} className="px-3 py-1 border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.55_0.04_145)] text-xs font-mono hover:opacity-80 transition-all">
            Logout
          </button>
        </div>

        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[oklch(0.60_0.04_145)] mb-4">{error}</motion.p>}

        {/* Create/Edit Form */}
        <div className="mb-12 p-6 border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.6)]">
          <h2 className="font-[family-name:var(--font-cormorant)] text-xl text-[oklch(0.80_0.02_145)] mb-4">
            {editingSlug ? "Edit Post" : "Create New Post"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[oklch(0.45_0.04_145)] mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                required
                className="w-full p-2 bg-[oklch(0.16_0.01_145)] border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.75_0.03_145)] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[oklch(0.45_0.04_145)] mb-1">Content (Markdown)</label>
              <textarea
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={12}
                className="w-full p-2 bg-[oklch(0.16_0.01_145)] border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.75_0.03_145)] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[oklch(0.45_0.04_145)] mb-1">Excerpt (optional)</label>
              <textarea
                value={form.excerpt}
                onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={2}
                className="w-full p-2 bg-[oklch(0.16_0.01_145)] border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.75_0.03_145)] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[oklch(0.45_0.04_145)] mb-1">Cover Image</label>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => setCoverFile(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="block file:mr-4 file:py-1 file:px-3 file:border-0 file:text-xs file:font-mono file:text-[oklch(0.45_0.04_145)] file:bg-[oklch(0.16_0.01_145)] file:border file:border-[oklch(0.30_0.04_145/0.5)] hover:file:opacity-80 cursor-pointer text-[oklch(0.55_0.04_145)] text-xs"
                />
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={!coverFile || uploading}
                  className="px-3 py-1 border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.55_0.04_145)] text-xs font-mono hover:opacity-80 disabled:opacity-50 transition-all"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
              {form.coverImage && (
                <div className="mt-2">
                  <img src={form.coverImage} alt="Cover preview" className="max-w-xs max-h-40 object-cover border border-[oklch(0.30_0.04_145/0.3)]" />
                  <p className="text-[10px] text-[oklch(0.35_0.04_145)] mt-1 font-mono">{form.coverImage}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !form.title.trim() || !form.content.trim()}
                className="px-4 py-2 border border-[oklch(0.45_0.10_145)] bg-[oklch(0.45_0.10_145)] text-[oklch(0.95_0.02_145)] text-xs font-mono hover:opacity-80 disabled:opacity-50 transition-all"
              >
                {loading ? "Saving..." : editingSlug ? "Update Post" : "Create Post"}
              </button>
              {editingSlug && (
                <button
                  type="button"
                  onClick={() => { setEditingSlug(null); setForm({ title: "", content: "", excerpt: "", coverImage: "" }); setCoverFile(null); }}
                  className="px-4 py-2 border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.55_0.04_145)] text-xs font-mono hover:opacity-80 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Posts List */}
        <div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[oklch(0.80_0.02_145)] mb-4">Existing Posts</h2>
          {loading && posts.length === 0 ? <p className="text-[oklch(0.55_0.04_145)]">Loading...</p> : posts.length === 0 ? <p className="text-[oklch(0.55_0.04_145)]">No posts yet.</p> : (
            <ul className="space-y-4">
              {posts.map(post => (
                <li key={post.slug} className="p-4 border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.6)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-[family-name:var(--font-cormorant)] text-lg text-[oklch(0.80_0.02_145)]">{post.title}</h3>
                      <p className="text-xs text-[oklch(0.35_0.04_145)] font-mono mt-1">
                        {new Date(post.created_at).toLocaleDateString()} {post.updated_at && `(updated: ${new Date(post.updated_at).toLocaleDateString()})`}
                      </p>
                      {post.excerpt && <p className="text-sm text-[oklch(0.55_0.04_145)] mt-2">{post.excerpt}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(post)} className="px-2 py-1 border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.55_0.04_145)] text-xs font-mono hover:opacity-80 transition-all">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(post.slug)} className="px-2 py-1 border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.55_0.04_145)] text-xs font-mono hover:opacity-80 transition-all">
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
