import { hasApiKey } from "@/lib/llm";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    has_api_key: hasApiKey(),
    provider: process.env.DEEPSEEK_API_KEY ? "deepseek" : "none",
  });
}
