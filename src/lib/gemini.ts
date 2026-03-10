import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export async function generateKPIInsights(prompt: string): Promise<string> {
  if (!API_KEY || API_KEY === "your-google-generative-ai-api-key") {
    return "AI insights are unavailable — please configure a valid GEMINI_API_KEY in your environment variables. You can get one free at https://aistudio.google.com/apikey";
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      return "The configured Gemini API key is invalid. Please update GEMINI_API_KEY in your environment variables with a valid key from https://aistudio.google.com/apikey";
    }
    return `AI insights temporarily unavailable: ${message}`;
  }
}
