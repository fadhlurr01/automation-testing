import { NextResponse } from "next/server";
import { InstagramAdapter } from "@/platforms/instagram/adapter";
import { mapInstagramMedia } from "@/platforms/instagram/mapper";
import { normalizeInstagramError } from "@/platforms/instagram/errors";

/**
 * Controlled development testing route for validating platform adapters.
 * Allows simulating and verifying each publishing stage:
 * 1. Connection check
 * 2. Media validation
 * 3. Container creation
 * 4. Container status polling
 * 5. Publishing confirmation & external URL retrieval
 * 6. Error handling & normalization
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      platform = "instagram",
      mode = "mock", // "mock" or "live"
      accessToken,
      accountId,
      caption = "Automation Hub Test Post #automation",
      mediaUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1080",
      mediaType = "image/jpeg",
    } = body;

    if (platform !== "instagram") {
      return NextResponse.json({ ok: false, error: `Platform '${platform}' test flow is not yet implemented.` }, { status: 400 });
    }

    const logs: string[] = [];
    logs.push("Step 1: Validating media payload and constraints");

    const mapped = mapInstagramMedia({
      accessToken: accessToken || "mock_access_token",
      accountId: accountId || "17841400000000000",
      content: { caption },
      media: { storagePath: "/test-image.jpg", mimeType: mediaType, url: mediaUrl },
    });

    logs.push(`Media mapped successfully -> Type: ${mapped.mediaType}, Account: ${mapped.accountId}`);

    if (mode === "live") {
      if (!accessToken || !accountId) {
        return NextResponse.json({
          ok: false,
          error: "Live mode requires 'accessToken' and 'accountId'",
          logs,
        }, { status: 400 });
      }

      logs.push("Step 2: Executing Live Meta Graph API Publishing Flow");
      const adapter = new InstagramAdapter();
      const result = await adapter.publish({
        accessToken,
        accountId,
        content: { caption },
        media: { storagePath: "/test-image.jpg", mimeType: mediaType, url: mediaUrl },
      });

      logs.push(`Post published -> External ID: ${result.externalPostId}`);
      logs.push("Step 3: Verifying post with Meta Graph API");
      const verified = await adapter.verify(result, accessToken);
      logs.push(`Verification status: ${verified ? "CONFIRMED" : "FAILED"}`);

      return NextResponse.json({
        ok: true,
        mode: "live",
        result,
        verified,
        logs,
      });
    }

    // Controlled Mock Simulation
    logs.push("Step 2: Simulating Meta Graph API container creation [POST /{account_id}/media]");
    const simulatedContainerId = "179" + Math.floor(10000000000000 + Math.random() * 90000000000000);
    logs.push(`Simulated Container ID: ${simulatedContainerId}`);

    logs.push("Step 3: Simulating media status polling -> Container FINISHED");

    logs.push("Step 4: Simulating media publish [POST /{account_id}/media_publish]");
    const simulatedPostId = "180" + Math.floor(10000000000000 + Math.random() * 90000000000000);
    const simulatedPermalink = `https://www.instagram.com/p/${Math.random().toString(36).substring(2, 9)}/`;
    logs.push(`Confirmed Post ID: ${simulatedPostId}, Permalink: ${simulatedPermalink}`);

    logs.push("Step 5: Simulating post verification via Meta Graph API");
    logs.push("Verification confirmed: status 200 OK");

    return NextResponse.json({
      ok: true,
      mode: "mock",
      result: {
        confirmed: true,
        externalPostId: simulatedPostId,
        externalUrl: simulatedPermalink,
        statusCode: 200,
        responseMetadata: {
          containerId: simulatedContainerId,
          mediaType: mapped.mediaType,
          permalink: simulatedPermalink,
        },
      },
      verified: true,
      logs,
    });
  } catch (error) {
    const normalized = normalizeInstagramError(error);
    return NextResponse.json({
      ok: false,
      error: normalized.message,
      code: normalized.code,
      retryable: normalized.retryable,
    }, { status: 400 });
  }
}
