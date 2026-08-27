import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  campaignId: z.string().uuid(),
  publishMode: z.enum(["now", "schedule"]).default("now"),
  date: z.string().optional(),
  time: z.string().optional(),
  timezone: z.string().default("Asia/Jakarta"),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });

  const { data, error } = await supabase
    .from("publishing_jobs")
    .select(`
      id,
      status,
      scheduled_at,
      published_at,
      error_message,
      created_at,
      campaign_targets (
        id,
        status,
        campaigns (
          id,
          name
        ),
        connected_accounts (
          id,
          account_name,
          platforms (
            id,
            name,
            slug
          )
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid campaign ID is required." }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("id, name, scheduled_at, timezone")
    .eq("id", parsed.data.campaignId)
    .eq("organization_id", membership.organization_id)
    .single();

  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  // Calculate target execution time
  let targetScheduledAt = new Date().toISOString();

  if (parsed.data.publishMode === "schedule") {
    if (parsed.data.scheduledAt) {
      targetScheduledAt = new Date(parsed.data.scheduledAt).toISOString();
    } else if (parsed.data.date && parsed.data.time) {
      targetScheduledAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`).toISOString();
    }
  }

  // Update campaign status
  await admin.from("campaigns").update({
    status: parsed.data.publishMode === "now" ? "approved" : "scheduled",
    scheduled_at: targetScheduledAt,
    timezone: parsed.data.timezone || "Asia/Jakarta",
  }).eq("id", campaign.id);

  // Fetch campaign targets
  const { data: targets } = await admin
    .from("campaign_targets")
    .select("id")
    .eq("campaign_id", campaign.id);

  if (!targets?.length) {
    return NextResponse.json({ error: "Campaign has no targets configured." }, { status: 400 });
  }

  // Create queued publishing jobs
  const { data: jobs, error } = await admin
    .from("publishing_jobs")
    .insert(
      targets.map((target) => ({
        campaign_target_id: target.id,
        status: "QUEUED",
        job_type: "publish",
        scheduled_at: targetScheduledAt,
      }))
    )
    .select("id, status, scheduled_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    jobs,
    queued: true,
    scheduledAt: targetScheduledAt,
    timezone: parsed.data.timezone || "Asia/Jakarta",
    mode: parsed.data.publishMode,
  }, { status: 202 });
}
