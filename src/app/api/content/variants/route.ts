import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { createContentTransformer } from "@/lib/content/transformer";

const schema = z.object({ contentId: z.string().uuid(), platformId: z.string().uuid(), instruction: z.string().max(500).optional() });

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contentId = new URL(request.url).searchParams.get("contentId"); if (!contentId) return NextResponse.json({ error: "Content id is required." }, { status: 400 });
  const { data: membership } = await supabase.from("users").select("organization_id").eq("id", user.id).single(); if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
  const { data, error } = await supabase.from("content_variants").select("id, platform_id, title, subtitle, body, caption, hashtags, tags, alt_text, metadata, status, platforms(id, name, slug, supports_image, supports_video, supports_article, supports_link)").eq("content_item_id", contentId).eq("content_items.organization_id", membership.organization_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ variants: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Content and platform are required." }, { status: 400 });
  const { data: membership } = await supabase.from("users").select("organization_id").eq("id", user.id).single(); if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
  const { data: content } = await supabase.from("content_items").select("title, description, caption, keywords, hashtags, cta, alt_text, seo_title, seo_description, facts").eq("id", parsed.data.contentId).eq("organization_id", membership.organization_id).single();
  const { data: platform } = await supabase.from("platforms").select("id, name, supports_image, supports_video, supports_article, supports_link, supports_hashtag, supports_tags").eq("id", parsed.data.platformId).single();
  if (!content || !platform) return NextResponse.json({ error: "Content or platform not found in this workspace." }, { status: 404 });
  const { data: brand } = await supabase.from("brand_profiles").select("brand_name, language, tone, brand_rules").eq("organization_id", membership.organization_id).maybeSingle();
  if (!brand) return NextResponse.json({ error: "Create a brand profile before generating variants." }, { status: 400 });
  try { const transformer = createContentTransformer(getAIProvider(), platform.name); const variant = await transformer.generateVariant(content, platform, brand, parsed.data.instruction); const { data, error } = await supabase.from("content_variants").upsert({ content_item_id: parsed.data.contentId, platform_id: platform.id, ...variant, status: "draft" }, { onConflict: "content_item_id,platform_id" }).select("id, content_item_id, platform_id, title, subtitle, body, caption, hashtags, tags, alt_text, metadata, status").single(); if (error) throw error; return NextResponse.json({ variant: data }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "AI provider is unavailable." }, { status: 503 }); }
}
