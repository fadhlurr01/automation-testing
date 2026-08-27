import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { retryDelaySeconds } from "@/lib/publishing/queue";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: membership } = await supabase.from("users").select("organization_id").eq("id", user.id).single(); if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
  const { data: job } = await supabase.from("publishing_jobs").select("id, attempts, max_attempts, campaign_targets!inner(campaigns!inner(organization_id))").eq("id", id).eq("campaign_targets.campaigns.organization_id", membership.organization_id).single();
  if (!job) return NextResponse.json({ error: "Publishing job not found." }, { status: 404 }); if (job.attempts >= job.max_attempts) return NextResponse.json({ error: "Maximum retry attempts reached." }, { status: 409 });
  const scheduledAt = new Date(Date.now() + retryDelaySeconds(job.attempts + 1) * 1000).toISOString(); const { data, error } = await supabase.from("publishing_jobs").update({ status: "RETRYING", scheduled_at: scheduledAt, error_message: null, updated_at: new Date().toISOString() }).eq("id", id).select("id, status, scheduled_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ job: data, queued: true }, { status: 202 });
}
