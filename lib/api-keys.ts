// 클라이언트 전용 — localStorage에서 사용자 입력 API 키 관리
import type { AIProvider } from "@/lib/ai";

const STORAGE_KEYS = {
  gemini: "geulbit-gemini-key",
  claude: "geulbit-claude-key",
} as const;

export function getStoredKey(provider: AIProvider): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEYS[provider]) || "";
}

export function setStoredKey(provider: AIProvider, key: string) {
  if (typeof window === "undefined") return;
  if (key) window.localStorage.setItem(STORAGE_KEYS[provider], key);
  else window.localStorage.removeItem(STORAGE_KEYS[provider]);
}

export function getApiKeyHeader(provider: AIProvider): Record<string, string> {
  const key = getStoredKey(provider);
  if (!key) return {};
  return provider === "claude"
    ? { "x-anthropic-api-key": key }
    : { "x-gemini-api-key": key };
}
