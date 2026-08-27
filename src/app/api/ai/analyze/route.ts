import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";

const requestSchema = z.object({ mediaAssetId: z.string().uuid(), suppliedContext: z.string().max(2000).optional() });

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid media selection." }, { status: 400 });
  const { data: asset, error } = await supabase.from("media_assets").select("storage_path, mime_type").eq("id", parsed.data.mediaAssetId).eq("user_id", user.id).single();
  if (error || !asset) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
  const { data: signed } = await supabase.storage.from("media").createSignedUrl(asset.storage_path, 600);
  if (!signed?.signedUrl) return NextResponse.json({ error: "Could not create secure media URL." }, { status: 500 });
  try {
    const provider = getAIProvider();
    const analysis = await provider.analyzeImage({ imageUrl: signed.signedUrl, suppliedContext: parsed.data.suppliedContext });
    return NextResponse.json({ analysis });
  } catch (providerError) {
    return NextResponse.json({ error: providerError instanceof Error ? providerError.message : "AI provider is unavailable." }, { status: 503 });
  }
}
