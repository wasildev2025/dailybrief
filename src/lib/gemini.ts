import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
] as const;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2_000;

function parseRetryDelay(message: string): number | null {
  const match = message.match(/retry in ([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1]) * 1_000) : null;
}

function isRetryable(message: string): boolean {
  return message.includes("429") || message.includes("503") || message.includes("RESOURCE_EXHAUSTED");
}

function isDailyQuotaExhausted(message: string): boolean {
  return message.includes("PerDay") && message.includes("FreeTier");
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryGenerateWithRetries(
  genAI: GoogleGenerativeAI,
  modelName: string,
  prompt: string,
): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      if (isDailyQuotaExhausted(message)) return null;
      if (!isRetryable(message)) throw error;
      if (attempt === MAX_RETRIES) return null;

      const serverDelay = parseRetryDelay(message);
      const backoff = serverDelay ?? BASE_DELAY_MS * Math.pow(2, attempt);
      const jitter = Math.random() * 1_000;
      await sleep(backoff + jitter);
    }
  }
  return null;
}

export async function generateKPIInsights(prompt: string): Promise<string> {
  if (!API_KEY || API_KEY === "your-google-generative-ai-api-key") {
    return "AI insights are unavailable — please configure a valid GEMINI_API_KEY in your environment variables. You can get one free at https://aistudio.google.com/apikey";
  }

  const genAI = new GoogleGenerativeAI(API_KEY);

  try {
    for (const modelName of MODELS) {
      const result = await tryGenerateWithRetries(genAI, modelName, prompt);
      if (result !== null) return result;
    }

    return "AI insights temporarily unavailable: all model quotas exhausted. If you're on the free tier, consider upgrading to a paid plan at https://ai.google.dev/pricing or wait for quotas to reset.";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      return "The configured Gemini API key is invalid. Please update GEMINI_API_KEY in your environment variables with a valid key from https://aistudio.google.com/apikey";
    }
    return `AI insights temporarily unavailable: ${message}`;
  }
}
