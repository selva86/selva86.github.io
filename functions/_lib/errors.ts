// JSON error responses with consistent shape.
// Every API endpoint should return either json() on success or jsonError() on failure.

export function json<T>(data: T, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      ...(init.headers || {}),
    },
  });
}

export function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>): Response {
  return json({ error: { code, message, ...(extra || {}) } }, { status });
}

export const err400 = (msg = "Malformed request.") => jsonError(400, "bad_request", msg);
export const err401 = () => jsonError(401, "unauthenticated", "Sign in to continue.");
export const err402 = (cta = "Upgrade to Pro to unlock this.") =>
  jsonError(402, "payment_required", cta);
export const err403 = (msg = "Not allowed.") => jsonError(403, "forbidden", msg);
export const err404 = (msg = "Not found.") => jsonError(404, "not_found", msg);
export const err409 = (msg = "Conflict.") => jsonError(409, "conflict", msg);
export const err429 = (msg = "Too many requests.") => jsonError(429, "rate_limited", msg);
export const err500 = (msg = "Something went wrong.") => jsonError(500, "internal", msg);
