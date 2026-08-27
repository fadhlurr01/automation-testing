export type AiAnalysis = {
  topic: string;
  facts: Record<string, string | string[]>;
  title: string;
  description: string;
  caption: string;
  keywords: string[];
  hashtags: string[];
  cta: string;
  seo_title: string;
  seo_description: string;
  alt_text: string;
};

export interface AIProvider {
  analyzeImage(input: { imageUrl: string; suppliedContext?: string }): Promise<AiAnalysis>;
  extractText(input: { imageUrl: string }): Promise<{ text: string; confidence?: number }>;
  generateContent(input: { topic: string; facts: Record<string, string | string[]>; instruction?: string }): Promise<Pick<AiAnalysis, "title" | "description" | "caption" | "keywords" | "hashtags" | "cta" | "seo_title" | "seo_description" | "alt_text">>;
  generatePlatformVariant(input: { analysis: AiAnalysis; platform: string; instruction?: string }): Promise<Record<string, unknown>>;
}

export function getAIProvider(): AIProvider {
  throw new Error("No AI provider configured. Add a server-side AI provider adapter before enabling generation.");
}
