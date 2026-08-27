import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: membership } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
  const { data, error } = await supabase.from("connected_accounts").select("id, account_name, username, status, platforms(id, name, slug, category, supports_image, supports_video, supports_article, supports_link, supports_hashtag, supports_tags)").eq("organization_id", membership.organization_id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ channels: data ?? [] });
}