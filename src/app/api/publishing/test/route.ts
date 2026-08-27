import { NextResponse } from "next/server";
import { getPlatformAdapter } from "@/lib/publishing/adapters";

/**
 * Controlled development testing route for validating platform adapters.
 * Allows simulating and verifying each publishing stage for Instagram, Pinterest, Medium, and Imgbox.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      platform = "pinterest",
      mode = "mock", // "mock" or "live"
      accessToken,
      accountId,
      title = "Automation Hub Test Publication",
      caption = "Automation Hub Test Post #automation #testing",
      bodyContent = "## Automation Hub\n\nTesting multi-platform publishing engine safely.",
      mediaUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1080",
      mediaType = "image/jpeg",
    } = body;

    const adapter = getPlatformAdapter(platform);
    if (!adapter) {
      return NextResponse.json(
        { ok: false, error: `Platform '${platform}' adapter is not configured.` },
        { status: 400 }
      );
    }

    const logs: string[] = [];
    logs.push(`Step 1: Initializing controlled test for platform '${platform}'`);

    const publishRequest = {
      accessToken: accessToken || "mock_token_12345",
      accountId: accountId || (platform === "pinterest" ? "mock_board_123" : "mock_account_123"),
      content: {
        title,
        caption,
        body: bodyContent,
        board_id: accountId || "mock_board_123",
        tags: ["automation", "testing", "tech"],
        publishStatus: "draft",
      },
      media: {
        storagePath: "/test-image.jpg",
        mimeType: mediaType,
        url: mediaUrl,
      },
    };

    if (mode === "live") {
      logs.push(`Step 2: Executing live API publishing flow for ${platform}`);
      const result = await adapter.publish(publishRequest);
      logs.push(`Step 3: Confirmed post ID: ${result.externalPostId}, URL: ${result.externalUrl || "N/A"}`);

      const verified = await adapter.verify(result, publishRequest.accessToken);
      logs.push(`Step 4: Post verification status: ${verified ? "CONFIRMED" : "UNVERIFIED"}`);

      return NextResponse.json({
        ok: true,
        mode: "live",
        platform,
        result,
        verified,
        logs,
      });
    }

    // Controlled Mock Simulation
    logs.push(`Step 2: Simulating ${platform.toUpperCase()} API payload formatting and validation`);
    const simulatedPostId = `${platform.toLowerCase()}_` + Math.random().toString(36).substring(2, 11);
    let simulatedUrl = "";

    switch (platform.toLowerCase()) {
      case "pinterest":
        simulatedUrl = `https://www.pinterest.com/pin/${simulatedPostId}/`;
        break;
      case "medium":
        simulatedUrl = `https://medium.com/@author/${simulatedPostId}`;
        break;
      case "imgbox":
        simulatedUrl = `https://images2.imgbox.com/8f/12/${simulatedPostId}_o.jpg`;
        break;
      default:
        simulatedUrl = `https://www.instagram.com/p/${simulatedPostId}/`;
    }

    logs.push(`Step 3: Simulated container/post creation -> ID: ${simulatedPostId}`);
    logs.push(`Step 4: Simulated post URL -> ${simulatedUrl}`);
    logs.push("Step 5: Simulated verification -> CONFIRMED 200 OK");

    return NextResponse.json({
      ok: true,
      mode: "mock",
      platform,
      result: {
        confirmed: true,
        externalPostId: simulatedPostId,
        externalUrl: simulatedUrl,
        statusCode: 200,
        responseMetadata: {
          simulated: true,
          platform,
          url: simulatedUrl,
        },
      },
      verified: true,
      logs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Test execution failed.",
      },
      { status: 400 }
    );
  }
}
