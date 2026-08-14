export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// A raw "Failed to fetch" is the browser's network-layer error (dropped
// connection, offline, etc.) — most likely to surface on slow/large uploads
// that take a while in flight. Re-throw with a message that actually helps.
function rethrowNetworkError(err: unknown): never {
  if (err instanceof TypeError) {
    throw new Error(
      "Couldn't reach the server. If you're uploading a large file, this can happen on a slow connection — check your connection and try again."
    );
  }
  throw err;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (err) {
    rethrowNetworkError(err);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.formErrors?.[0] ?? data?.error ?? "Request failed");
  }
  return data;
}

// For multipart/form-data uploads — no Content-Type header, so the browser
// can set it with the correct multipart boundary.
export async function apiUpload(path: string, formData: FormData) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } catch (err) {
    rethrowNetworkError(err);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.formErrors?.[0] ?? data?.error ?? "Upload failed");
  }
  return data;
}
