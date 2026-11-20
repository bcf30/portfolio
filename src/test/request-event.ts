interface RequestEventInit {
  path?: string;
  method?: string;
  password?: string;
  json?: unknown;
  body?: BodyInit;
  params?: Record<string, string>;
}

/**
 * Builds the subset of SvelteKit's RequestEvent that the API handlers read
 * (request, url, params). Typed as `never` so it can be passed to any route's
 * handler without restating that route's generated param types.
 */
export function requestEvent({ path = "/", method = "GET", password, json, body, params = {} }: RequestEventInit = {}): never {
  const url = new URL(path, "http://localhost");
  const headers = new Headers();
  if (password !== undefined) headers.set("x-admin-password", password);
  if (json !== undefined) headers.set("Content-Type", "application/json");
  const request = new Request(url, { method, headers, body: json !== undefined ? JSON.stringify(json) : body });
  return { request, url, params } as never;
}
