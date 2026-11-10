/** fetch + JSON with a timeout and bounded retries on network errors / 5xx / 429. */
export async function fetchJson<T>(
  url: URL | string,
  init: RequestInit = {},
  { retries = 2, timeoutMs = 10_000 }: { retries?: number; timeoutMs?: number } = {},
): Promise<{ status: number; data: T | null }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status === 404) return { status: 404, data: null };
      if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return { status: res.status, data: null };
      return { status: res.status, data: (await res.json()) as T };
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
