const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export const buildApiUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const parseApiError = async (response: Response, fallbackMessage: string) => {
  try {
    const data = await response.json();
    if (data?.error) {
      return data.error as string;
    }
  } catch (error) {
    return fallbackMessage;
  }
  return fallbackMessage;
};
