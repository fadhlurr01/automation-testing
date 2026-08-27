import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPlatformAdapter } from "@/lib/publishing/adapters";
import { decryptToken } from "@/lib/oauth/tokens";

/**
 * Background Scheduler Worker
 * Runs independently of browser sessions.
 * Queries all QUEUED publishing jobs whose scheduled_at <= NOW() and executes them.
 */
export async function POST(request: Request) {
  try {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();

    // 1. Fetch due queued jobs
    const { data: dueJobs, error: jobsErr } = await admin
      .from("publishing_jobs")
      .select(`
        id,
        status,
        scheduled_at,
        campaign_target_id,
        campaign_targets (
          id,
          status,
          connected_account_id,
          content_variant_id,
          campaign_id,
          campaigns (
            id,
            name,
            organization_id
          ),
          connected_accounts (
            id,
            account_id,
            account_name,
            platforms (
              id,
              name,
              slug
            )
          ),
          content_variants (
            id,
            title,
            caption,
            body,
            hashtags,
            content_items (
              id,
              title,
              caption,
              media_asset_id,
              media_assets (
                id,
                storage_path,
                mime_type
              )
            )
          )
        )
      `)
      .eq("status", "QUEUED")
      .lte("scheduled_at", now)
      .limit(20);

    if (jobsErr) {
      return NextResponse.json({ error: jobsErr.message }, { status: 500 });
    }

    if (!dueJobs || dueJobs.length === 0) {
      return NextResponse.json({ message: "No scheduled jobs due at this time.", processed: 0 });
    }

    const results: Array<{ jobId: string; platform: string; status: string; externalPostId?: string; error?: string }> = [];

    // 2. Process each due job
    for (const job of dueJobs) {
      // Mark as IN_PROGRESS
      await admin.from("publishing_jobs").update({ status: "IN_PROGRESS" }).eq("id", job.id);

      const rawTarget = job.campaign_targets as any;
      const target = Array.isArray(rawTarget) ? rawTarget[0] : rawTarget;

      if (!target) {
        await admin.from("publishing_jobs").update({ status: "FAILED", error_message: "Missing target association." }).eq("id", job.id);
        continue;
      }

      const connectedAcc = Array.isArray(target.connected_accounts) ? target.connected_accounts[0] : target.connected_accounts;
      const platformRow = Array.isArray(connectedAcc?.platforms) ? connectedAcc.platforms[0] : connectedAcc?.platforms;
      const platformSlug = platformRow?.slug;
      const accountId = connectedAcc?.account_id;
      const rawVariant = target.content_variants;
      const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
      const rawCamp = target.campaigns;
      const campaignRow = Array.isArray(rawCamp) ? rawCamp[0] : rawCamp;

      if (!platformSlug) {
        await admin.from("publishing_jobs").update({ status: "FAILED", error_message: "Unknown platform target." }).eq("id", job.id);
        continue;
      }

      const adapter = getPlatformAdapter(platformSlug);

      // Fetch decrypted OAuth token if available
      let accessToken = "token_placeholder";
      if (target.connected_account_id) {
        const { data: tokenRow } = await admin
          .from("oauth_tokens")
          .select("access_token_encrypted")
          .eq("connected_account_id", target.connected_account_id)
          .single();

        if (tokenRow?.access_token_encrypted) {
          accessToken = decryptToken(tokenRow.access_token_encrypted);
        }
      }

      // Execute adapter or simulated runner
      if (adapter) {
        try {
          const rawContentItem = variant?.content_items;
          const contentItem = Array.isArray(rawContentItem) ? rawContentItem[0] : rawContentItem;
          const rawMediaAsset = contentItem?.media_assets;
          const mediaAsset = Array.isArray(rawMediaAsset) ? rawMediaAsset[0] : rawMediaAsset;

          let signedUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200";

          if (mediaAsset?.storage_path) {
            const { data: signed } = await admin.storage.from("media").createSignedUrl(mediaAsset.storage_path, 3600);
            if (signed?.signedUrl) signedUrl = signed.signedUrl;
          }

          const publishRes = await adapter.publish({
            accessToken,
            accountId: accountId || "account_default",
            content: {
              title: variant?.title || campaignRow?.name || "Publication",
              caption: variant?.caption || variant?.body || "",
              body: variant?.body || variant?.caption || "",
              tags: variant?.hashtags || [],
            },
            media: {
              url: signedUrl,
              mimeType: mediaAsset?.mime_type || "image/jpeg",
              storagePath: mediaAsset?.storage_path || "/media.jpg",
            },
          });

          // Mark job as COMPLETED / PUBLISHED
          await admin.from("publishing_jobs").update({
            status: "COMPLETED",
            published_at: new Date().toISOString(),
          }).eq("id", job.id);

          await admin.from("campaign_targets").update({
            status: "published",
          }).eq("id", target.id);

          results.push({
            jobId: job.id,
            platform: platformSlug,
            status: "COMPLETED",
            externalPostId: publishRes.externalPostId,
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Publishing execution failed.";
          await admin.from("publishing_jobs").update({
            status: "FAILED",
            error_message: errMsg,
          }).eq("id", job.id);

          await admin.from("campaign_targets").update({
            status: "failed",
          }).eq("id", target.id);

          results.push({
            jobId: job.id,
            platform: platformSlug,
            status: "FAILED",
            error: errMsg,
          });
        }
      } else {
        // Fallback for non-adapter / simulation
        await admin.from("publishing_jobs").update({
          status: "COMPLETED",
          published_at: new Date().toISOString(),
        }).eq("id", job.id);

        await admin.from("campaign_targets").update({
          status: "published",
        }).eq("id", target.id);

        results.push({
          jobId: job.id,
          platform: platformSlug,
          status: "COMPLETED",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} scheduled jobs.`,
      processed: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduler run error." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
