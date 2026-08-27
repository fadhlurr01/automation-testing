import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/oauth/tokens";
import { getPlatformAdapter } from "@/lib/publishing/adapters";
import { getOAuthProvider } from "@/lib/oauth/provider";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { platform = "instagram", connectedAccountId, accessToken, accountId } = body;

    // Direct token test mode (for dev/testing environments)
    if (accessToken && typeof accessToken === "string") {
      const adapter = getPlatformAdapter(platform);
      if (!adapter || !adapter.testConnection) {
        return NextResponse.json(
          { ok: false, error: `No test connection handler available for platform '${platform}'` },
          { status: 400 }
        );
      }

      const result = await adapter.testConnection(accessToken, accountId);
      return NextResponse.json(result);
    }

    // Authenticated DB lookup mode
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Query connected account
    let query = admin
      .from("connected_accounts")
      .select("id, account_id, account_name, username, status, platforms(slug), oauth_tokens(access_token_encrypted)");

    if (connectedAccountId) {
      query = query.eq("id", connectedAccountId);
    } else {
      // Find connected account by platform slug
      const { data: platformData } = await admin.from("platforms").select("id").eq("slug", platform).single();
      if (!platformData) {
        return NextResponse.json(
          { ok: false, error: `Platform '${platform}' not found in database.` },
          { status: 404 }
        );
      }
      query = query.eq("platform_id", platformData.id);
    }

    const { data: accounts, error: accountError } = await query;
    if (accountError || !accounts || accounts.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `No connected account found for ${platform}. Please connect your account first via OAuth.`,
        },
        { status: 404 }
      );
    }

    const targetAccount = accounts[0];
    const rawTokens = targetAccount.oauth_tokens;
    const tokenRecord = Array.isArray(rawTokens) ? rawTokens[0] : rawTokens;

    if (!tokenRecord || !tokenRecord.access_token_encrypted) {
      return NextResponse.json(
        { ok: false, error: "No OAuth token stored for this account. Reconnect is required." },
        { status: 400 }
      );
    }

    const plainAccessToken = decryptToken(tokenRecord.access_token_encrypted);
    const platformSlug =
      (targetAccount.platforms as { slug?: string } | null)?.slug || platform;

    const adapter = getPlatformAdapter(platformSlug);
    if (!adapter || !adapter.testConnection) {
      // Fallback to OAuthProvider getAccountInfo
      const provider = getOAuthProvider(platformSlug);
      if (!provider) {
        return NextResponse.json(
          { ok: false, error: `No active adapter configured for ${platformSlug}.` },
          { status: 400 }
        );
      }

      try {
        const info = await provider.getAccountInfo(plainAccessToken);
        return NextResponse.json({
          ok: true,
          accountName: info.accountName,
          username: info.username,
          accountId: info.accountId,
        });
      } catch (err) {
        return NextResponse.json(
          { ok: false, error: err instanceof Error ? err.message : "Connection validation failed." },
          { status: 400 }
        );
      }
    }

    const testResult = await adapter.testConnection(plainAccessToken, targetAccount.account_id);
    return NextResponse.json(testResult);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during test connection.",
      },
      { status: 500 }
    );
  }
}
