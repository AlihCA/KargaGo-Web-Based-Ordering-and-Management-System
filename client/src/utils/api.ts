const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
const API_BASE_URL = RAW_BASE.replace(/\/+$/, ""); // remove trailing slash

export const buildApiUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export async function parseApiError(response: Response, fallbackMessage: string) {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      return (data?.error || data?.message || fallbackMessage) as string;
    }

    // Non-JSON (HTML, text)
    const text = await response.text().catch(() => "");
    if (text.trim()) {
      return `${fallbackMessage}\n\nServer returned non-JSON:\n${text.slice(0, 200)}`;
    }
    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Expected JSON but got "${contentType || "unknown"}". First response chars:\n${text.slice(
        0,
        200
      )}`
    );
  }
  return response.json() as Promise<T>;
}

