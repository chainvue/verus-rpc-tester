import type {
  CallResponse,
  MethodsResponse,
  StatusResponse,
} from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchStatus(): Promise<StatusResponse> {
  return getJson<StatusResponse>("/api/status");
}

export function fetchMethods(): Promise<MethodsResponse> {
  return getJson<MethodsResponse>("/api/methods");
}

export async function fetchHelp(method: string): Promise<string> {
  const data = await getJson<{ method: string; text: string }>(
    `/api/help/${encodeURIComponent(method)}`,
  );
  return data.text;
}

export async function callMethod(
  method: string,
  params: unknown[],
): Promise<CallResponse> {
  const res = await fetch("/api/call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  // Both ok and rpc-error cases come back as JSON; only true server faults throw.
  const data = (await res.json().catch(() => null)) as CallResponse | null;
  if (!data) throw new Error(`Server error: ${res.status}`);
  return data;
}
