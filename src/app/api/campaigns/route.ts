import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/audit/audit-logger";

const targetSchema = z.object({
  connectedAccountId: z.string().uuid().optional(),
  platformSlug: z.string().optional(),
  contentVariantId: z.string().uuid().optional(),
});

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  contentId: z.string().uuid().optional(),
  directContent: z
    .object({
      title: z.string().optional(),
      caption: z.string().optional(),
      body: z.string().optional(),
      mediaUrl: z.string().optional(),
      mediaAssetId: z.string().uuid().optional(),
      tags: z.array(z.string()).optional(),
      link: z.string().optional(),
    })
    .optional(),
  targets: z.array(targetSchema).optional().default([]),
  platformSlugs: z.array(z.string()).optional().default([]),
  status: z.enum(["draft", "scheduled", "approved"]).default("draft"),
  scheduledAt: z.string().datetime().nullable().optional(),
  timezone: z.string().default("UTC"),
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
    .from("campaigns")
    .select(`
      id,
      name,
      description,
      status,
      scheduled_at,
      timezone,
      created_at,
      campaign_targets (
        id,
        status,
        scheduled_at,
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
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rawBody = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid campaign name (1-120 characters)." },
        { status: 400 }
      );
    }

    const { data: membership } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });

    const admin = createSupabaseAdminClient();
    let effectiveContentId = parsed.data.contentId;

    // If direct content is provided without an existing contentId, create content item
    if (!effectiveContentId && parsed.data.directContent) {
      const dc = parsed.data.directContent;
      const { data: createdContent, error: contentErr } = await admin
        .from("content_items")
        .insert({
          organization_id: membership.organization_id,
          media_asset_id: dc.mediaAssetId || null,
          title: dc.title || parsed.data.name,
          caption: dc.caption || dc.body || null,
          description: dc.body || dc.caption || null,
          hashtags: dc.tags || [],
          keywords: dc.tags || [],
          cta: dc.link || null,
          status: "ready",
          ai_generated: false,
          facts: {},
        })
        .select("id")
        .single();

      if (contentErr) {
        return NextResponse.json({ error: `Could not create content item: ${contentErr.message}` }, { status: 400 });
      }
      effectiveContentId = createdContent.id;
    }

    // Create Campaign Record
    const { data: campaign, error: campError } = await admin
      .from("campaigns")
      .insert({
        organization_id: membership.organization_id,
        created_by: user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        status: parsed.data.status,
        scheduled_at: parsed.data.scheduledAt || null,
        timezone: parsed.data.timezone,
      })
      .select("id, status, scheduled_at, name")
      .single();

    if (campError) return NextResponse.json({ error: campError.message }, { status: 400 });

    // Handle Targets
    const platformSlugs = Array.from(
      new Set([
        ...parsed.data.platformSlugs,
        ...parsed.data.targets.map((t) => t.platformSlug).filter((s): s is string => Boolean(s)),
      ])
    );

    if (effectiveContentId && platformSlugs.length > 0) {
      // Find platform records
      const { data: platformRows } = await admin
        .from("platforms")
        .select("id, slug")
        .in("slug", platformSlugs);

      if (platformRows && platformRows.length > 0) {
        for (const p of platformRows) {
          // Create content variant for this platform if needed
          const { data: variant } = await admin
            .from("content_variants")
            .insert({
              content_item_id: effectiveContentId,
              platform_id: p.id,
              variant_type: "post",
              title: parsed.data.directContent?.title || parsed.data.name,
              caption: parsed.data.directContent?.caption || null,
              body: parsed.data.directContent?.body || null,
              hashtags: parsed.data.directContent?.tags || [],
              status: "ready",
            })
            .select("id")
            .single();

          // Check if user has connected account for this platform
          const { data: connAccounts } = await admin
            .from("connected_accounts")
            .select("id")
            .eq("organization_id", membership.organization_id)
            .eq("platform_id", p.id);

          const connectedAccountId = connAccounts && connAccounts[0]?.id;
          if (connectedAccountId && variant) {
            await admin.from("campaign_targets").insert({
              campaign_id: campaign.id,
              connected_account_id: connectedAccountId,
              content_variant_id: variant.id,
              status: parsed.data.status === "approved" ? "queued" : "pending",
              scheduled_at: parsed.data.scheduledAt || null,
            });
          }
        }
      }
    }

    // Record Audit Log
    const action = parsed.data.status === "approved" ? "CAMPAIGN_APPROVAL" : parsed.data.status === "scheduled" ? "SCHEDULE" : "CAMPAIGN_CREATION";
    await recordAuditLog({
      organizationId: membership.organization_id,
      actorId: user.id,
      actorName: user.email?.split("@")[0] || "User",
      action,
      entityType: "campaign",
      entityId: campaign.id,
      description: `Campaign "${campaign.name}" created with status ${campaign.status.toUpperCase()}`,
      status: "SUCCESS",
    });

    return NextResponse.json({ campaign, success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected campaign creation error." },
      { status: 500 }
    );
  }
}