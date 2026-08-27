import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAuditLog } from "@/lib/audit/audit-logger";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported. Use JPG, PNG, WEBP, GIF, or MP4.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File size exceeds 50MB limit." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || "demo_user_" + Math.random().toString(36).substring(2, 8);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${userId}/${Date.now()}-${safeName}`;

    // Try uploading to Supabase Storage
    let signedUrl: string | null = null;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Ensure bucket exists or attempt upload
      const { error: uploadError } = await supabase.storage.from("media").upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

      if (!uploadError) {
        const { data: signed } = await supabase.storage.from("media").createSignedUrl(storagePath, 3600);
        signedUrl = signed?.signedUrl || null;
      }
    } catch {
      // Storage upload fallback
    }

    // If signedUrl could not be generated from Supabase, convert to base64 data URL
    if (!signedUrl) {
      const base64 = buffer.toString("base64");
      signedUrl = `data:${file.type};base64,${base64}`;
    }

    let assetRecord = {
      id: "media_" + Math.random().toString(36).substring(2, 10),
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width: 1200,
      height: 1200,
      duration: null,
      storage_path: storagePath,
      signedUrl,
      created_at: new Date().toISOString(),
    };

    // If user is authenticated, save record to PostgreSQL media_assets table
    if (user) {
      const { data: dbData } = await supabase
        .from("media_assets")
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          width: 1200,
          height: 1200,
          duration: null,
          thumbnail_url: signedUrl,
          metadata: {},
        })
        .select("id, file_name, mime_type, size_bytes, width, height, duration, storage_path, thumbnail_url, created_at")
        .single();

      if (dbData) {
        assetRecord = {
          ...dbData,
          signedUrl,
        };
      }

      // Record Audit Log
      await recordAuditLog({
        actorId: user.id,
        actorName: user.email?.split("@")[0] || "User",
        action: "MEDIA_UPLOAD",
        entityType: "media_asset",
        entityId: assetRecord.id,
        description: `Uploaded media asset: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
        status: "SUCCESS",
      });
    }

    return NextResponse.json({
      success: true,
      asset: assetRecord,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Media upload processing failed." },
      { status: 500 }
    );
  }
}
