import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAIProvider, SupportedLanguage } from "@/lib/ai/provider";
import { recordAuditLog } from "@/lib/audit/audit-logger";

const requestSchema = z.object({
  mediaAssetId: z.string().uuid().optional(),
  topic: z.string().max(2000).optional(),
  suppliedContext: z.string().max(2000).optional(),
  language: z.enum(["id", "en"]).default("id"),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request parameters." }, { status: 400 });
  }

  const { mediaAssetId, topic, suppliedContext, language } = parsed.data;
  const provider = getAIProvider();

  try {
    let analysis;
    let entityId = "text_prompt";
    let entityName = topic || "Creative Brief";

    if (mediaAssetId) {
      if (!user) {
        // Fallback analysis when unauthenticated in demo mode
        analysis = await provider.analyzeImage({
          imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200",
          suppliedContext: suppliedContext || topic,
          language: language as SupportedLanguage,
        });
      } else {
        const { data: asset, error } = await supabase
          .from("media_assets")
          .select("storage_path, mime_type, file_name")
          .eq("id", mediaAssetId)
          .eq("user_id", user.id)
          .single();

        if (error || !asset) {
          return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
        }

        entityId = mediaAssetId;
        entityName = asset.file_name;

        const { data: signed } = await supabase.storage.from("media").createSignedUrl(asset.storage_path, 600);
        const imageUrl = signed?.signedUrl || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200";

        analysis = await provider.analyzeImage({
          imageUrl,
          suppliedContext: suppliedContext || topic,
          language: language as SupportedLanguage,
        });
      }
    } else {
      // Direct Topic / Prompt Generation
      analysis = await provider.generateContent({
        topic: topic || suppliedContext || (language === "id" ? "Peluncuran Kampanye Digital" : "Digital Campaign Launch"),
        instruction: suppliedContext,
        language: language as SupportedLanguage,
      });
    }

    // Record Audit Log if user is logged in
    if (user) {
      await recordAuditLog({
        actorId: user.id,
        actorName: user.email?.split("@")[0] || "User",
        action: "AI_GENERATION",
        entityType: "ai_analysis",
        entityId,
        description: `AI generated content (${language.toUpperCase()}) for ${entityName}`,
        status: "SUCCESS",
      });
    }

    return NextResponse.json({ analysis });
  } catch (providerError) {
    return NextResponse.json(
      { error: providerError instanceof Error ? providerError.message : "AI provider is unavailable." },
      { status: 503 }
    );
  }
}
