import OpenAI from "openai";
import { config } from "@/lib/config";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    if (!config.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

/** @deprecated Prefer getOpenAI() for lazy init / clearer errors */
export const openaiClient = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    return Reflect.get(getOpenAI(), prop, receiver);
  },
});

export default openaiClient;
