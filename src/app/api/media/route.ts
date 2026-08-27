import { NextResponse } from "next/server";
import { z } from "zod";
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

const uploadSchema = z.object({
  storagePath: z.string().min(1).max(500),
  filename: z.string().min(1).max(255),
  mimeType: z.string().refine((m) => ALLOWED_MIME_TYPES.includes(m), {
    message: "Unsupported file type.",
  }),
  fileSize: z.number().positive().max(MAX_FILE_SIZE_BYTES, {
    message: "File size exceeds 50MB limit.",
  }),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("media_assets")
    .select("id, file_name, mime_type, size_bytes, width, height, duration, storage_path, thumbnail_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assets = await Promise.all(
    (data ?? []).map(async (asset) => {
      const { data: signed } = await supabase.storage.from("media").createSignedUrl(asset.storage_path, 3600);
      return { ...asset, signedUrl: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json().catch(() => ({}));
  const parsed = uploadSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid upload parameters." },
      { status: 400 }
    );
  }

  // Sanitize storage path against directory traversal
  const sanitizedPath = parsed.data.storagePath.replace(/\.\./g, "").replace(/^\/+/, "");

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      user_id: user.id,
      storage_path: sanitizedPath,
      file_name: parsed.data.filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_"),
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.fileSize,
      width: parsed.data.width ?? null,
      height: parsed.data.height ?? null,
      duration: parsed.data.duration ?? null,
      thumbnail_url: null,
      metadata: {},
    })
    .select("id, file_name, mime_type, size_bytes, width, height, duration, storage_path, thumbnail_url, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Record Audit Log
  await recordAuditLog({
    actorId: user.id,
    actorName: user.email?.split("@")[0] || "User",
    action: "MEDIA_UPLOAD",
    entityType: "media_asset",
    entityId: data.id,
    description: `Uploaded media file: ${data.file_name} (${(data.size_bytes / 1024).toFixed(1)} KB)`,
    status: "SUCCESS",
  });

  const { data: signed } = await supabase.storage.from("media").createSignedUrl(data.storage_path, 3600);
  return NextResponse.json({ asset: { ...data, signedUrl: signed?.signedUrl ?? null } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, filename } = await request.json().catch(() => ({}));
  if (!id || !filename) return NextResponse.json({ error: "ID and filename are required." }, { status: 400 });

  const sanitizedFilename = String(filename).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 255);

  const { data, error } = await supabase
    .from("media_assets")
    .update({ file_name: sanitizedFilename })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, file_name")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ asset: data });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Asset ID is required." }, { status: 400 });

  const { data: asset, error: findError } = await supabase
    .from("media_assets")
    .select("storage_path, file_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (findError || !asset) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });

  const { error: storageError } = await supabase.storage.from("media").remove([asset.storage_path]);
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });

  const { error } = await supabase.from("media_assets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
