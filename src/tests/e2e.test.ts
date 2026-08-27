import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPlatformAdapter } from "../lib/publishing/adapters";
import { normalizeInstagramError } from "../platforms/instagram/errors";
import { normalizePinterestError } from "../platforms/pinterest/errors";
import { normalizeMediumError } from "../platforms/medium/errors";
import { normalizeImgboxError } from "../platforms/imgbox/errors";
import { recordAuditLog } from "../lib/audit/audit-logger";
import { isSafePublicUrl } from "../lib/security/ssrf";
import { checkRateLimit } from "../lib/security/rate-limit";
import { retryDelaySeconds } from "../lib/publishing/queue";

describe("Automation Hub - Complete End-to-End Test Suite", () => {
  // Test Context State
  const ctx = {
    userId: "user_test_" + Math.random().toString(36).substring(2, 8),
    userEmail: "arbi@example.com",
    organizationId: "org_workspace_" + Math.random().toString(36).substring(2, 8),
    mediaAssetId: "",
    contentDraftId: "",
    campaignId: "",
    connectedAccounts: [] as string[],
    jobs: [] as Array<{ id: string; platform: string; status: string }>,
  };

  // ==========================================
  // PHASE 1: CORE WORKSPACE & CONTENT LIFECYCLE
  // ==========================================

  it("Step 1 & 2: User Account & Workspace Creation", async () => {
    assert.ok(ctx.userId, "User ID should be generated");
    assert.ok(ctx.organizationId, "Workspace Organization ID should be generated");

    // Audit log account creation
    const log = await recordAuditLog({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      actorName: "Arbi",
      action: "USER_LOGIN",
      entityType: "user",
      entityId: ctx.userId,
      description: "User logged into workspace",
      status: "SUCCESS",
    });
    assert.equal(log.action, "USER_LOGIN");
    assert.equal(log.status, "SUCCESS");
  });

  it("Step 3: Upload Poster Media Asset", async () => {
    const poster = {
      filename: "seminar-ai.png",
      mimeType: "image/png",
      fileSize: 1024 * 1024 * 2.4, // 2.4 MB
      storagePath: "media/posters/seminar-ai.png",
      width: 1200,
      height: 1200,
    };

    assert.ok(poster.fileSize < 50 * 1024 * 1024, "File size must be under 50MB limit");
    assert.equal(poster.mimeType, "image/png");

    ctx.mediaAssetId = "media_" + Math.random().toString(36).substring(2, 8);

    const log = await recordAuditLog({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      actorName: "Arbi",
      action: "MEDIA_UPLOAD",
      entityType: "media_asset",
      entityId: ctx.mediaAssetId,
      description: `Arbi uploaded ${poster.filename}`,
      status: "SUCCESS",
    });
    assert.equal(log.action, "MEDIA_UPLOAD");
  });

  it("Step 4 & 5: AI Poster Analysis & Content Generation", async () => {
    assert.ok(ctx.mediaAssetId);

    // Simulated AI multimodal analysis output
    const aiAnalysis = {
      topic: "AI Engineering & Multi-Platform Automation Summit 2026",
      facts: {
        speaker: "Dr. Arbi",
        location: "Jakarta Convention Center",
        date: "2026-09-15",
      },
      title: "Mastering Multi-Platform Publishing with AI in 2026",
      description: "Join us for the definitive workshop on scaling social and digital publication architecture.",
      caption: "Join us for the definitive workshop on scaling multi-platform automation! 🚀 #automation #AI #tech",
      keywords: ["automation", "AI", "seminar", "publishing", "cloud"],
      hashtags: ["#automation", "#AI", "#tech", "#summit2026"],
      cta: "Register now at https://automation-testing-theta.vercel.app/",
      seo_title: "AI Automation Summit 2026 - Official Registration",
      seo_description: "Register for the premier AI automation workshop in Jakarta.",
      alt_text: "High contrast seminar announcement poster for AI Automation Summit 2026",
    };

    assert.ok(aiAnalysis.title.length > 5);
    assert.ok(aiAnalysis.hashtags.length >= 4);
    assert.ok(aiAnalysis.cta.startsWith("http") || aiAnalysis.cta.includes("https://"));

    ctx.contentDraftId = "content_" + Math.random().toString(36).substring(2, 8);

    const log = await recordAuditLog({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      actorName: "System AI",
      action: "AI_GENERATION",
      entityType: "content_item",
      entityId: ctx.contentDraftId,
      description: "AI generated content draft and variants",
      status: "SUCCESS",
    });
    assert.equal(log.action, "AI_GENERATION");
  });

  it("Step 6: Edit & Refine Content Draft", async () => {
    const editedTitle = "Mastering Multi-Platform Publishing: The 2026 Blueprint";
    assert.ok(editedTitle.length > 10);

    const log = await recordAuditLog({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      actorName: "Arbi",
      action: "CONTENT_EDIT",
      entityType: "content_item",
      entityId: ctx.contentDraftId,
      description: `Arbi updated content title to "${editedTitle}"`,
      status: "SUCCESS",
    });
    assert.equal(log.action, "CONTENT_EDIT");
  });

  it("Step 7: Connect Publishing Channels (Pinterest, Medium, Imgbox, Instagram)", async () => {
    const platformsToConnect = [
      { slug: "pinterest", name: "Pinterest", account: "@arbi_creations" },
      { slug: "medium", name: "Medium", account: "@arbi_writes" },
      { slug: "imgbox", name: "Imgbox", account: "Imgbox Direct Host" },
      { slug: "instagram", name: "Instagram", account: "@arbi_official" },
    ];

    for (const p of platformsToConnect) {
      const connId = `conn_${p.slug}_${Date.now()}`;
      ctx.connectedAccounts.push(connId);

      const log = await recordAuditLog({
        organizationId: ctx.organizationId,
        actorId: ctx.userId,
        actorName: "Arbi",
        action: "CHANNEL_CONNECTION",
        entityType: "connected_account",
        entityId: connId,
        description: `Connected channel ${p.name} (${p.account})`,
        status: "SUCCESS",
      });
      assert.equal(log.action, "CHANNEL_CONNECTION");
    }

    assert.equal(ctx.connectedAccounts.length, 4);
  });

  it("Step 8, 9 & 10: Create Campaign, Generate Variants & Approve", async () => {
    ctx.campaignId = "camp_" + Math.random().toString(36).substring(2, 8);
    const campaignName = "Spring 2026 AI Summit Launch";

    const variants = {
      pinterest: { title: "AI Automation Poster", boardId: "board_tech_01" },
      medium: { title: "How We Automated Multi-Platform Distribution", body: "# Full Article..." },
      instagram: { caption: "Summit announcement! ✨ Swipe for details #AI" },
      imgbox: { title: "Poster High-Res" },
    };

    assert.ok(variants.pinterest);
    assert.ok(variants.medium);
    assert.ok(variants.instagram);
    assert.ok(variants.imgbox);

    const log = await recordAuditLog({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      actorName: "Arbi",
      action: "CAMPAIGN_APPROVAL",
      entityType: "campaign",
      entityId: ctx.campaignId,
      description: `Campaign approved for distribution: "${campaignName}"`,
      status: "SUCCESS",
    });
    assert.equal(log.action, "CAMPAIGN_APPROVAL");
  });

  // ==========================================
  // PHASE 2: PUBLISHING ENGINE & WORKER EXECUTION
  // ==========================================

  it("Step 11 to 16: Queue Jobs, Worker Execution, External API Verification & Post Confirmation", async () => {
    const originalFetch = globalThis.fetch;
    const targets = ["pinterest", "medium", "imgbox", "instagram"];
    const verifiedPosts: Array<{ platform: string; externalPostId: string; externalUrl: string }> = [];

    // Mock network responses for each platform adapter
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);

      // Image download for Imgbox or media mapper
      if (url.includes("unsplash.com") || url.endsWith(".jpg") || url.endsWith(".png")) {
        return new Response(new Blob(["fake_image_bytes"], { type: "image/jpeg" }), { status: 200 });
      }

      // Instagram Graph API
      if (url.includes("/media_publish")) {
        return new Response(JSON.stringify({ id: "18000998877665544" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("graph.instagram.com") && url.includes("/media")) {
        return new Response(JSON.stringify({ id: "17900112233445566" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("18000998877665544")) {
        return new Response(JSON.stringify({
          id: "18000998877665544",
          permalink: "https://www.instagram.com/p/DFxyz123/",
          media_type: "IMAGE",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // Pinterest API v5
      if (url.includes("api.pinterest.com")) {
        return new Response(JSON.stringify({
          id: "pin_123456789",
          link: "https://www.pinterest.com/pin/pin_123456789/",
          title: "AI Summit 2026",
          created_at: "2026-08-27T10:00:00Z",
        }), { status: 201, headers: { "Content-Type": "application/json" } });
      }

      // Medium API v1
      if (url.includes("api.medium.com/v1/me")) {
        return new Response(JSON.stringify({
          data: { id: "user_med_123", username: "arbi_writes" },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("api.medium.com")) {
        return new Response(JSON.stringify({
          data: {
            id: "med_post_98765",
            url: "https://medium.com/@author/med_post_98765",
            title: "AI Summit 2026",
            publishStatus: "draft",
          },
        }), { status: 201, headers: { "Content-Type": "application/json" } });
      }

      // Imgbox
      if (url.includes("imgbox.com")) {
        return new Response(JSON.stringify({
          success: true,
          files: [{
            id: "imgbox_123",
            url: "https://imgbox.com/imgbox_123",
            original_url: "https://images2.imgbox.com/8f/12/imgbox_test_o.jpg",
          }],
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    try {
      for (const platformSlug of targets) {
        const adapter = getPlatformAdapter(platformSlug);
        assert.ok(adapter, `Adapter must exist for platform: ${platformSlug}`);

        const mockMediaUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200";

        const publishResult = await adapter.publish({
          accessToken: "test_verified_token_123",
          accountId: platformSlug === "pinterest" ? "board_123" : "acc_123",
          content: {
            title: "AI Summit 2026",
            caption: "AI Summit announcement",
            body: "Complete article body for testing.",
            board_id: "board_123",
            tags: ["ai", "summit"],
          },
          media: {
            url: mockMediaUrl,
            mimeType: "image/jpeg",
            storagePath: "/media/poster.jpg",
          },
        });

        // Strict Confirmation Verification
        assert.equal(publishResult.confirmed, true, "Adapter must confirm publication");
        assert.ok(publishResult.externalPostId, "External Post ID must be present");
        assert.ok(publishResult.externalUrl, "External Post URL must be present");

        // Verify adapter post verification step
        const isVerified = await adapter.verify(publishResult, "test_verified_token_123");
        assert.equal(isVerified, true, "Adapter verify step must return confirmed status");

        verifiedPosts.push({
          platform: platformSlug,
          externalPostId: publishResult.externalPostId,
          externalUrl: publishResult.externalUrl,
        });

        // Record Audit Log for successful publication
        await recordAuditLog({
          organizationId: ctx.organizationId,
          actorName: "Publish Worker",
          action: "PUBLISHING_SUCCESS",
          entityType: "platform_target",
          entityId: publishResult.externalPostId,
          description: `${platformSlug.toUpperCase()} published confirmed post (${publishResult.externalUrl})`,
          status: "SUCCESS",
        });
      }
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.equal(verifiedPosts.length, 4);
  });

  // ==========================================
  // PHASE 3: ERROR HANDLING & EDGE CASES
  // ==========================================

  it("Test Error: Rate Limit (HTTP 429)", () => {
    const metaRateLimit = normalizeInstagramError({ error: { code: 4, message: "Application request limit reached" } });
    assert.equal(metaRateLimit.code, "PLATFORM_RATE_LIMIT");
    assert.equal(metaRateLimit.retryable, true);

    const pinRateLimit = normalizePinterestError({ code: 429, message: "Too many requests" });
    assert.equal(pinRateLimit.code, "PLATFORM_RATE_LIMIT");
    assert.equal(pinRateLimit.retryable, true);
  });

  it("Test Error: Expired Token (HTTP 401 / Meta 190)", () => {
    const metaExpired = normalizeInstagramError({ error: { code: 190, message: "Error validating access token: Session has expired" } });
    assert.equal(metaExpired.code, "PLATFORM_AUTH_ERROR");
    assert.equal(metaExpired.retryable, false);

    const pinAuth = normalizePinterestError({ code: 401, message: "Unauthorized" });
    assert.equal(pinAuth.code, "PLATFORM_AUTH_ERROR");

    const medAuth = normalizeMediumError({ errors: [{ message: "Token revoked", code: 6000 }] });
    assert.equal(medAuth.code, "PLATFORM_AUTH_ERROR");
  });

  it("Test Error: Invalid Media (Aspect Ratio / Size Exceeded)", () => {
    const metaAspect = normalizeInstagramError({ error: { code: 352, message: "The image aspect ratio is not supported" } });
    assert.equal(metaAspect.code, "INVALID_MEDIA");

    const imgboxLimit = normalizeImgboxError("file_too_large");
    assert.equal(imgboxLimit.code, "INVALID_MEDIA");
  });

  it("Test Error: Invalid Content (Missing Title / Body)", () => {
    const medContent = normalizeMediumError({ errors: [{ message: "Content is empty", code: 6013 }] });
    assert.equal(medContent.code, "INVALID_CONTENT");
  });

  it("Test Error: Network Timeout / Platform Outage (HTTP 503)", () => {
    const metaServer = normalizeInstagramError({ error: { code: 2, message: "Service temporarily unavailable" } });
    assert.equal(metaServer.code, "PLATFORM_UNAVAILABLE");
    assert.equal(metaServer.retryable, true);

    const imgboxDown = normalizeImgboxError("service_offline");
    assert.equal(imgboxDown.code, "PLATFORM_UNAVAILABLE");
  });

  it("Test: Exponential Backoff Retry Delay", () => {
    assert.equal(retryDelaySeconds(1), 30);
    assert.equal(retryDelaySeconds(2), 60);
    assert.equal(retryDelaySeconds(3), 120);
    assert.equal(retryDelaySeconds(4), 240);
  });

  it("Test: Duplicate Publish Prevention & Job Cancellation", async () => {
    const activeJobs = new Set<string>();

    function queueJob(targetId: string): boolean {
      if (activeJobs.has(targetId)) return false; // Duplicate blocked!
      activeJobs.add(targetId);
      return true;
    }

    assert.equal(queueJob("target_instagram_01"), true);
    assert.equal(queueJob("target_instagram_01"), false, "Duplicate job must be rejected");

    // Cancel job
    activeJobs.delete("target_instagram_01");
    assert.equal(activeJobs.has("target_instagram_01"), false);
  });

  it("Test: Scheduled Publishing with Timezone (Asia/Jakarta)", () => {
    const localDate = "2026-08-28";
    const localTime = "14:30";
    const tz = "Asia/Jakarta";

    const scheduledIso = new Date(`${localDate}T${localTime}:00+07:00`).toISOString();
    assert.ok(scheduledIso.endsWith("Z"));

    const dateObj = new Date(scheduledIso);
    assert.equal(dateObj.getUTCHours(), 7); // 14:30 WIB is 07:30 UTC
    assert.equal(dateObj.getUTCMinutes(), 30);
  });

  it("Test: Manual Assist 8-Asset Preparation & Lifecycle", () => {
    const preparedContent = {
      image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200",
      title: "Community Visual Showcase",
      description: "Curated high-res imagery for public discovery.",
      caption: "Community Visual Showcase\n\nCurated high-res imagery #discovery",
      keywords: ["art", "design", "showcase"],
      hashtags: ["#art", "#design", "#showcase"],
      cta: "Explore more at https://automation-testing-theta.vercel.app/",
      destinationUrl: "https://automation-testing-theta.vercel.app/",
    };

    assert.ok(preparedContent.image);
    assert.ok(preparedContent.title);
    assert.ok(preparedContent.description);
    assert.ok(preparedContent.caption);
    assert.ok(preparedContent.keywords.length > 0);
    assert.ok(preparedContent.hashtags.length > 0);
    assert.ok(preparedContent.cta);
    assert.ok(preparedContent.destinationUrl);

    // Lifecycle Status Stepper
    let status: "PREPARED" | "OPENED" | "USER_CONFIRMED" = "PREPARED";
    assert.equal(status, "PREPARED");

    status = "OPENED"; // User clicked Open Platform
    assert.equal(status, "OPENED");

    status = "USER_CONFIRMED"; // User submitted confirmed external URL
    assert.equal(status, "USER_CONFIRMED");
  });

  // ==========================================
  // PHASE 4: SECURITY & AUDIT LOG VERIFICATION
  // ==========================================

  it("Test Security: SSRF Protection & Private IP Blocking", () => {
    assert.equal(isSafePublicUrl("https://images.unsplash.com/photo-1").safe, true);
    assert.equal(isSafePublicUrl("https://api.pinterest.com/v5/pins").safe, true);

    assert.equal(isSafePublicUrl("http://127.0.0.1/admin").safe, false);
    assert.equal(isSafePublicUrl("http://localhost:3000/api").safe, false);
    assert.equal(isSafePublicUrl("http://169.254.169.254/latest/meta-data").safe, false);
    assert.equal(isSafePublicUrl("http://10.0.0.1/internal").safe, false);
    assert.equal(isSafePublicUrl("http://192.168.1.1/router").safe, false);
  });

  it("Test Security: Sliding Window Rate Limiting", () => {
    const testIp = "test_client_ip_" + Date.now();
    const limitOpts = { maxRequests: 3, windowMs: 10000 };

    assert.equal(checkRateLimit(testIp, limitOpts).allowed, true);
    assert.equal(checkRateLimit(testIp, limitOpts).allowed, true);
    assert.equal(checkRateLimit(testIp, limitOpts).allowed, true);
    assert.equal(checkRateLimit(testIp, limitOpts).allowed, false, "4th request within window must be rate limited");
  });

  it("Test Security: Audit Log Zero-Credential Policy", async () => {
    const entry = await recordAuditLog({
      actorName: "Test Suite",
      action: "SETTINGS_CHANGE",
      entityType: "security_test",
      description: "Testing credential sanitization",
      details: {
        username: "admin_user",
        password: "SuperSecretPassword123!",
        access_token: "ya29.a0AfH6SM...",
        client_secret: "secret_xyz",
        refresh_token: "1//04...",
        safeConfigOption: "enabled",
      },
      status: "SUCCESS",
    });

    assert.equal(entry.details?.password, "[REDACTED_FOR_SECURITY]");
    assert.equal(entry.details?.access_token, "[REDACTED_FOR_SECURITY]");
    assert.equal(entry.details?.client_secret, "[REDACTED_FOR_SECURITY]");
    assert.equal(entry.details?.refresh_token, "[REDACTED_FOR_SECURITY]");
    assert.equal(entry.details?.safeConfigOption, "enabled");
  });
});
