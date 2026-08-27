import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("platforms").select("id, name, slug, category, supports_image, supports_video, supports_article, supports_link, supports_hashtag, supports_tags").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ platforms: data ?? [] });
}
