// DeepSeek client (uses OpenAI-compatible SDK).
// Falls back to a high-fidelity scripted run if DEEPSEEK_API_KEY is missing
// so the demo always works.

import OpenAI from "openai";

export function hasApiKey() {
  return !!process.env.DEEPSEEK_API_KEY;
}

export function getClient(): OpenAI | null {
  if (!process.env.DEEPSEEK_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });
}

export function getModel() {
  return process.env.DEEPSEEK_MODEL || "deepseek-chat";
}
