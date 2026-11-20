import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/svelte";
import AdminPage from "./+page.svelte";

const POSTS = [
  {
    id: 1,
    title: "First post",
    slug: "first-post",
    content: "First body",
    excerpt: "First excerpt",
    cover_image: "https://blob.example/first.png",
    created_at: "2026-04-07T16:00:00Z",
    updated_at: "2026-04-08T16:00:00Z",
  },
  {
    id: 2,
    title: "Second post",
    slug: "second-post",
    content: "Second body",
    excerpt: null,
    cover_image: null,
    created_at: "2026-03-18T16:00:00Z",
    updated_at: null,
  },
];

type Route = (init: RequestInit) => Response | Promise<Response>;
const json = (body: unknown, status = 200) => Response.json(body, { status });

// Fake API: GET /api/posts always works; other "METHOD url" keys can be overridden per test
let routes: Record<string, Route>;
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  routes = {
    "GET /api/posts": () => json(POSTS),
    "POST /api/posts": () => json({ slug: "new" }, 201),
    "PUT /api/posts/first-post": () => json({ slug: "first-post" }),
    "DELETE /api/posts/first-post": () => json({ message: "Post deleted" }),
    "POST /api/upload": () => json({ url: "https://blob.example/uploaded.png" }),
  };
  fetchMock.mockImplementation(async (input, init = {}) => {
    const key = `${init.method ?? "GET"} ${String(input)}`;
    const route = routes[key];
    if (!route) throw new Error(`unexpected request: ${key}`);
    return route(init);
  });
  vi.stubGlobal("fetch", fetchMock);
});

/** Requests made with the given method, as [url, init] pairs. */
const requests = (method: string) =>
  fetchMock.mock.calls.filter(([, init]) => (init?.method ?? "GET") === method).map(([url, init]) => [String(url), init ?? {}] as const);

async function logIn(password = "secret") {
  render(AdminPage);
  await fireEvent.input(screen.getByPlaceholderText("Enter admin password"), { target: { value: password } });
  await fireEvent.submit(screen.getByRole("button", { name: "Login" }).closest("form")!);
  await screen.findByText("First post");
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const postForm = () => field("Title").closest("form")!;
const postItem = (title: string) => screen.getByText(title).closest("li")!;

async function fillPost(title: string, content: string, excerpt = "") {
  await fireEvent.input(field("Title"), { target: { value: title } });
  await fireEvent.input(field("Content (Markdown)"), { target: { value: content } });
  await fireEvent.input(field("Excerpt (optional)"), { target: { value: excerpt } });
}

describe("login", () => {
  it("shows only the login form at first and makes no requests", () => {
    render(AdminPage);
    expect(screen.getByText("Admin Login")).toBeTruthy();
    expect(screen.queryByText("Blog Admin")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores a blank password", async () => {
    render(AdminPage);
    await fireEvent.input(screen.getByPlaceholderText("Enter admin password"), { target: { value: "   " } });
    await fireEvent.submit(screen.getByRole("button", { name: "Login" }).closest("form")!);
    expect(screen.getByText("Admin Login")).toBeTruthy();
  });

  it("loads and lists the posts after logging in", async () => {
    await logIn();
    expect(screen.getByText("Blog Admin")).toBeTruthy();
    expect(screen.getByText("Second post")).toBeTruthy();
    expect(screen.getByText("First excerpt")).toBeTruthy();
    expect(within(postItem("First post")).getByText(/2026-04-07 \(updated: 2026-04-08\)/)).toBeTruthy();
    expect(requests("GET")).toHaveLength(1);
  });

  it("shows an error if the posts can't be loaded", async () => {
    routes["GET /api/posts"] = () => json({ error: "boom" }, 500);
    render(AdminPage);
    await fireEvent.input(screen.getByPlaceholderText("Enter admin password"), { target: { value: "secret" } });
    await fireEvent.submit(screen.getByRole("button", { name: "Login" }).closest("form")!);
    expect(await screen.findByText("Failed to fetch posts")).toBeTruthy();
  });

  it("logs out back to the login form", async () => {
    await logIn();
    await fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(screen.getByText("Admin Login")).toBeTruthy();
    expect((screen.getByPlaceholderText("Enter admin password") as HTMLInputElement).value).toBe("");
  });
});

describe("creating a post", () => {
  it("keeps the submit button disabled until title and content are filled", async () => {
    await logIn();
    const submit = screen.getByRole("button", { name: "Create Post" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    await fillPost("Hello", "");
    expect(submit.disabled).toBe(true);
    await fillPost("Hello", "Body");
    expect(submit.disabled).toBe(false);
  });

  it("POSTs the post with the admin password, then clears the form and reloads the list", async () => {
    await logIn("hunter2");
    await fillPost("Hello", "Body", "Short");
    await fireEvent.submit(postForm());

    await vi.waitFor(() => expect(requests("GET")).toHaveLength(2));
    const [[url, init]] = requests("POST");
    expect(url).toBe("/api/posts");
    expect(new Headers(init.headers).get("x-admin-password")).toBe("hunter2");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toMatchObject({ title: "Hello", content: "Body", excerpt: "Short", cover_image: null });
    expect(field("Title").value).toBe("");
    expect(field("Content (Markdown)").value).toBe("");
  });

  it("shows the server's error message and keeps what was typed", async () => {
    routes["POST /api/posts"] = () => json({ error: "Unauthorized" }, 401);
    await logIn("wrong");
    await fillPost("Hello", "Body");
    await fireEvent.submit(postForm());

    expect(await screen.findByText("Unauthorized")).toBeTruthy();
    expect(field("Title").value).toBe("Hello");
    expect(requests("GET")).toHaveLength(1); // no reload after a failed save
  });
});

describe("editing a post", () => {
  it("fills the form from the post and PUTs to its slug", async () => {
    await logIn();
    await fireEvent.click(within(postItem("First post")).getByRole("button", { name: "Edit" }));

    expect(screen.getByText("Edit Post")).toBeTruthy();
    expect(field("Title").value).toBe("First post");
    expect(field("Content (Markdown)").value).toBe("First body");
    expect(field("Excerpt (optional)").value).toBe("First excerpt");
    expect((screen.getByAltText("Cover preview") as HTMLImageElement).src).toBe("https://blob.example/first.png");

    await fireEvent.input(field("Title"), { target: { value: "First post, revised" } });
    await fireEvent.submit(postForm());

    await vi.waitFor(() => expect(requests("PUT")).toHaveLength(1));
    const [[url, init]] = requests("PUT");
    expect(url).toBe("/api/posts/first-post");
    expect(JSON.parse(init.body as string)).toMatchObject({
      title: "First post, revised",
      content: "First body",
      cover_image: "https://blob.example/first.png",
    });
    await vi.waitFor(() => expect(screen.getByText("Create New Post")).toBeTruthy());
  });

  it("cancel goes back to an empty create form", async () => {
    await logIn();
    await fireEvent.click(within(postItem("First post")).getByRole("button", { name: "Edit" }));
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Create New Post")).toBeTruthy();
    expect(field("Title").value).toBe("");
    expect(screen.queryByAltText("Cover preview")).toBeNull();
  });
});

describe("deleting a post", () => {
  it("DELETEs after confirmation and reloads the list", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    await logIn("hunter2");
    await fireEvent.click(within(postItem("First post")).getByRole("button", { name: "Delete" }));

    await vi.waitFor(() => expect(requests("GET")).toHaveLength(2));
    const [[url, init]] = requests("DELETE");
    expect(url).toBe("/api/posts/first-post");
    expect(new Headers(init.headers).get("x-admin-password")).toBe("hunter2");
  });

  it("does nothing if the confirmation is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    await logIn();
    await fireEvent.click(within(postItem("First post")).getByRole("button", { name: "Delete" }));
    expect(requests("DELETE")).toHaveLength(0);
  });

  it("clears the form when the post being edited is deleted", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    await logIn();
    await fireEvent.click(within(postItem("First post")).getByRole("button", { name: "Edit" }));
    await fireEvent.click(within(postItem("First post")).getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(screen.getByText("Create New Post")).toBeTruthy());
    expect(field("Title").value).toBe("");
  });

  it("shows the server's error message", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    routes["DELETE /api/posts/first-post"] = () => json({ error: "Post not found" }, 404);
    await logIn();
    await fireEvent.click(within(postItem("First post")).getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Post not found")).toBeTruthy();
  });
});

describe("uploading a cover image", () => {
  const COVER = new File(["bytes"], "cover.png", { type: "image/png" });

  async function chooseFile(file: File) {
    const input = field("Cover Image");
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    await fireEvent.change(input);
  }

  it("keeps Upload disabled until a file is chosen", async () => {
    await logIn();
    const upload = screen.getByRole("button", { name: "Upload" }) as HTMLButtonElement;
    expect(upload.disabled).toBe(true);
    await chooseFile(COVER);
    expect(upload.disabled).toBe(false);
  });

  it("uploads the file and uses the returned URL as the cover", async () => {
    await logIn("hunter2");
    await chooseFile(COVER);
    await fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    const preview = (await screen.findByAltText("Cover preview")) as HTMLImageElement;
    expect(preview.src).toBe("https://blob.example/uploaded.png");
    expect(screen.getByText("https://blob.example/uploaded.png")).toBeTruthy();

    const [[url, init]] = requests("POST");
    expect(url).toBe("/api/upload");
    expect(new Headers(init.headers).get("x-admin-password")).toBe("hunter2");
    expect((init.body as FormData).get("file")).toBe(COVER);

    // The uploaded URL is saved with the post
    await fillPost("With cover", "Body");
    await fireEvent.submit(postForm());
    await vi.waitFor(() => expect(requests("POST")).toHaveLength(2));
    expect(JSON.parse(requests("POST")[1][1].body as string).cover_image).toBe("https://blob.example/uploaded.png");
  });

  it("alerts when the upload fails", async () => {
    const alert = vi.fn();
    vi.stubGlobal("alert", alert);
    routes["POST /api/upload"] = () => json({ error: "Upload failed" }, 500);
    await logIn();
    await chooseFile(COVER);
    await fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    await vi.waitFor(() => expect(alert).toHaveBeenCalledWith("Upload failed"));
    expect(screen.queryByAltText("Cover preview")).toBeNull();
  });
});
