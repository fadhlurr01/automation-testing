import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ campaignId: z.string().uuid() });
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Campaign id is required." }, { status: 400 });
  const { data: membership } = await supabase.from("users").select("organization_id").eq("id", user.id).single(); if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
  const { data: campaign } = await supabase.from("campaigns").select("id, scheduled_at").eq("id", parsed.data.campaignId).eq("organization_id", membership.organization_id).single(); if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  const { data: targets } = await supabase.from("campaign_targets").select("id").eq("campaign_id", campaign.id); if (!targets?.length) return NextResponse.json({ error: "Campaign has no targets." }, { status: 400 });
  const { data: jobs, error } = await supabase.from("publishing_jobs").insert(targets.map((target) => ({ campaign_target_id: target.id, status: "QUEUED", job_type: "publish", scheduled_at: campaign.scheduled_at ?? new Date().toISOString() }))).select("id, status, scheduled_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ jobs, queued: true }, { status: 202 });
}
