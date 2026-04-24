import { API_BASE_URL } from "../api/config";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

export function toAbsoluteMediaUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${normalizedPath}`;
}
