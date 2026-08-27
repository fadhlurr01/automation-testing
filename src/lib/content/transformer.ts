export type PlatformCapabilities = {
  supports_image: boolean;
  supports_video: boolean;
  supports_article: boolean;
  supports_link: boolean;
  supports_hashtag: boolean;
  supports_tags: boolean;
};

export type BrandProfile = { brand_name: string; language: string; tone: string | null; brand_rules: Record<string, unknown> };
export type MasterContent = { title: string | null; description: string | null; caption: string | null; keywords: string[]; hashtags: string[]; cta: string | null; alt_text: string | null; seo_title: string | null; seo_description: string | null; facts: Record<string, unknown> };
export type PlatformVariant = { title?: string; subtitle?: string; body?: string; caption?: string; hashtags?: string[]; tags?: string[]; alt_text?: string; metadata?: Record<string, unknown> };

export interface ContentTransformer {
  generateVariant(content: MasterContent, platformCapabilities: PlatformCapabilities, brandProfile: BrandProfile, instruction?: string): Promise<PlatformVariant>;
}

export function createContentTransformer(provider: { generatePlatformVariant(input: { analysis: MasterContent; platform: string; instruction?: string }): Promise<Record<string, unknown>> }, platform: string): ContentTransformer {
  return {
    async generateVariant(content, capabilities, brandProfile, instruction) {
      const generated = await provider.generatePlatformVariant({ analysis: content, platform, instruction });
      const variant: PlatformVariant = {};
      if (capabilities.supports_article) { variant.title = typeof generated.title === "string" ? generated.title : undefined; variant.subtitle = typeof generated.subtitle === "string" ? generated.subtitle : undefined; variant.body = typeof generated.body === "string" ? generated.body : undefined; }
      if (capabilities.supports_image || capabilities.supports_video) { variant.alt_text = typeof generated.alt_text === "string" ? generated.alt_text : content.alt_text ?? undefined; }
      if (capabilities.supports_link) variant.metadata = { destination_url: generated.destination_url ?? undefined };
      if (capabilities.supports_hashtag) variant.hashtags = Array.isArray(generated.hashtags) ? generated.hashtags.filter((value): value is string => typeof value === "string") : [];
      if (capabilities.supports_tags) variant.tags = Array.isArray(generated.tags) ? generated.tags.filter((value): value is string => typeof value === "string") : [];
      if (!capabilities.supports_article && typeof generated.caption === "string") variant.caption = generated.caption;
      if (!capabilities.supports_article && typeof generated.body === "string") variant.body = generated.body;
      variant.metadata = { ...(variant.metadata ?? {}), brand: brandProfile.brand_name, language: brandProfile.language, tone: brandProfile.tone };
      return variant;
    },
  };
}
