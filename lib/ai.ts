import * as gemini from "@/lib/gemini";
import * as claude from "@/lib/claude";

export type AIProvider = "gemini" | "claude";

export const DEFAULT_PROVIDER: AIProvider = "gemini";

export function getProvider(input: unknown): AIProvider {
  return input === "claude" ? "claude" : "gemini";
}

export function getAI(provider: AIProvider) {
  return provider === "claude" ? claude : gemini;
}
