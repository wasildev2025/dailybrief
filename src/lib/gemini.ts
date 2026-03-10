import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBGSlNIbA4iU_dQo6cpFEdNUo_DrPLFnFM";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateKPIInsights(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
