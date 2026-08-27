import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ mediaAssetId: z.string().uuid().nullable(), analysis: z.object({ topic: z.string(), facts: z.record(z.string(), z.union([z.string(), z.array(z.string())])), title: z.string(), description: z.string(), caption: z.string(), keywords: z.array(z.string()), hashtags: z.array(z.string()), cta: z.string(), seo_title: z.string(), seo_description: z.string(), alt_text: z.string() }) });

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: membership } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
  const { data, error } = await supabase.from("content_items").select("id, title, caption, status, media_asset_id, created_at").eq("organization_id", membership.organization_id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid content draft." }, { status: 400 });
  const { data: membership } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
  const { analysis } = parsed.data;
  const { data, error } = await supabase.from("content_items").insert({ organization_id: membership.organization_id, media_asset_id: parsed.data.mediaAssetId, title: analysis.title, description: analysis.description, caption: analysis.caption, keywords: analysis.keywords, hashtags: analysis.hashtags, cta: analysis.cta, alt_text: analysis.alt_text, facts: analysis.facts, seo_title: analysis.seo_title, seo_description: analysis.seo_description, ai_generated: true, status: "draft" }).select("id, status, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ content: data }, { status: 201 });
}
