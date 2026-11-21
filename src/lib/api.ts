"use client";

/**
 * Client-side API helpers with timeout handling and friendly errors.
 * All requests use relative paths only.
 */

async function request<T>(
  url: string,
  method: "GET" | "POST" | "PATCH",
  body?: unknown,
  timeoutMs = 180_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON response */
    }
    const payload = data as { ok?: boolean; error?: string } | null;
    if (!res.ok || !payload || payload.ok === false) {
      throw new Error(payload?.error || "Something went wrong. Please try again.");
    }
    return payload as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("This is taking longer than expected. Please check your connection and retry.");
    }
    throw err instanceof Error ? err : new Error("Something went wrong. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}

export function apiGet<T>(url: string, timeoutMs = 30_000): Promise<T> {
  return request<T>(url, "GET", undefined, timeoutMs);
}

export function apiPost<T>(url: string, body?: unknown, timeoutMs = 180_000): Promise<T> {
  return request<T>(url, "POST", body, timeoutMs);
}

export function apiPatch<T>(url: string, body?: unknown, timeoutMs = 45_000): Promise<T> {
  return request<T>(url, "PATCH", body, timeoutMs);
}
