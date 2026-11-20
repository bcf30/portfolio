import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestEvent } from "../../../test/request-event.ts";

vi.mock("$app/env/private", () => ({ ADMIN_PASSWORD_HASH: "secret", ADMIN_PASSWORD: undefined, BLOB_READ_WRITE_TOKEN: "blob-token" }));
vi.mock("@vercel/blob", () => ({ put: vi.fn() }));

import { POST } from "./+server.ts";
import { put } from "@vercel/blob";

function formWith(file?: File): FormData {
  const form = new FormData();
  if (file) form.append("file", file);
  return form;
}

const upload = (password: string | undefined, body: BodyInit) =>
  POST(requestEvent({ path: "/api/upload", method: "POST", password, body }));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/upload", () => {
  const COVER = new File(["fake image bytes"], "my cover.png", { type: "image/png" });

  it("returns 401 without the right password", async () => {
    expect((await upload(undefined, formWith(COVER))).status).toBe(401);
    expect((await upload("wrong", formWith(COVER))).status).toBe(401);
    expect(put).not.toHaveBeenCalled();
  });

  it("returns 400 when no file is attached", async () => {
    const response = await upload("secret", formWith());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "No file provided" });
  });

  it("stores the file publicly under a timestamped name with spaces replaced", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    vi.mocked(put).mockResolvedValue({ url: "https://blob.example/1700000000000-my_cover.png" } as never);

    const response = await upload("secret", formWith(COVER));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://blob.example/1700000000000-my_cover.png" });
    const [filename, file, options] = vi.mocked(put).mock.calls[0];
    expect(filename).toBe("1700000000000-my_cover.png");
    expect(await (file as File).text()).toBe("fake image bytes");
    expect(options).toEqual({ access: "public", token: "blob-token" });
  });

  it("returns 500 when Blob storage fails", async () => {
    vi.mocked(put).mockRejectedValue(new Error("blob down"));
    const response = await upload("secret", formWith(COVER));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Upload failed" });
  });
});
