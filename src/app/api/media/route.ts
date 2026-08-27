import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("media_assets").select("id, file_name, mime_type, size_bytes, width, height, duration, storage_path, thumbnail_url, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const assets = await Promise.all((data ?? []).map(async (asset) => {
    const { data: signed } = await supabase.storage.from("media").createSignedUrl(asset.storage_path, 3600);
    return { ...asset, signedUrl: signed?.signedUrl ?? null };
  }));
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabase.from("media_assets").insert({ user_id: user.id, storage_path: body.storagePath, file_name: body.filename, mime_type: body.mimeType, size_bytes: body.fileSize, width: body.width ?? null, height: body.height ?? null, duration: body.duration ?? null, thumbnail_url: null, metadata: {} }).select("id, file_name, mime_type, size_bytes, width, height, duration, storage_path, thumbnail_url, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: signed } = await supabase.storage.from("media").createSignedUrl(data.storage_path, 3600);
  return NextResponse.json({ asset: { ...data, signedUrl: signed?.signedUrl ?? null } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, filename } = await request.json();
  const { data, error } = await supabase.from("media_assets").update({ file_name: filename }).eq("id", id).eq("user_id", user.id).select("id, file_name").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ asset: data });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  const { data: asset, error: findError } = await supabase.from("media_assets").select("storage_path").eq("id", id).eq("user_id", user.id).single();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 404 });
  const { error: storageError } = await supabase.storage.from("media").remove([asset.storage_path]);
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });
  const { error } = await supabase.from("media_assets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
