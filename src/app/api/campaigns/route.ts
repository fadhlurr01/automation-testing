import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(2000).optional(), contentId: z.string().uuid(), targets: z.array(z.object({ connectedAccountId: z.string().uuid(), contentVariantId: z.string().uuid() })).min(1), status: z.enum(["draft", "scheduled", "approved"]).default("draft"), scheduledAt: z.string().datetime().nullable().optional(), timezone: z.string().default("UTC") });

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Campaign needs a content item and at least one valid target." }, { status: 400 });
  const { data: membership } = await supabase.from("users").select("organization_id").eq("id", user.id).single(); if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
  const accountIds = parsed.data.targets.map((target) => target.connectedAccountId); const variantIds = parsed.data.targets.map((target) => target.contentVariantId);
  const { data: accounts } = await supabase.from("connected_accounts").select("id").eq("organization_id", membership.organization_id).in("id", accountIds); const { data: variants } = await supabase.from("content_variants").select("id, content_items!inner(id, organization_id)").in("id", variantIds).eq("content_items.organization_id", membership.organization_id);
  if ((accounts?.length ?? 0) !== new Set(accountIds).size || (variants?.length ?? 0) !== new Set(variantIds).size) return NextResponse.json({ error: "One or more targets are not valid for this workspace." }, { status: 400 });
  const { data: campaign, error } = await supabase.from("campaigns").insert({ organization_id: membership.organization_id, created_by: user.id, name: parsed.data.name, description: parsed.data.description, status: parsed.data.status, scheduled_at: parsed.data.scheduledAt ?? null, timezone: parsed.data.timezone }).select("id, status, scheduled_at").single(); if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: targetError } = await supabase.from("campaign_targets").insert(parsed.data.targets.map((target) => ({ campaign_id: campaign.id, connected_account_id: target.connectedAccountId, content_variant_id: target.contentVariantId, status: "pending", scheduled_at: parsed.data.scheduledAt ?? null }))); if (targetError) return NextResponse.json({ error: targetError.message }, { status: 400 });
  return NextResponse.json({ campaign }, { status: 201 });
}