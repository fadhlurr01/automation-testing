import type { OAuthAccount, OAuthProvider } from "@/lib/oauth/provider";
import { normalizeInstagramError } from "./errors";
import { instagramPermissions } from "./capabilities";

const oauthBase = "https://api.instagram.com";
const graphBase = "https://graph.instagram.com";

function getOAuthConfig() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Developer configuration required: INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET must be configured.");
  }

  return { clientId, clientSecret };
}

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw normalizeInstagramError(body);
  }
  return body as Record<string, unknown>;
}

export class InstagramOAuthProvider implements OAuthProvider {
  getAuthorizationUrl({ state, redirectUri }: { state: string; redirectUri: string }): string {
    const { clientId } = getOAuthConfig();
    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: instagramPermissions.join(","),
      state,
    });

    return `${oauthBase}/oauth/authorize?${query.toString()}`;
  }

  async handleCallback({ code, redirectUri }: { code: string; redirectUri: string }) {
    const { clientId, clientSecret } = getOAuthConfig();

    // 1. Exchange authorization code for short-lived access token
    const tokenResponse = await fetch(`${oauthBase}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    const shortLived = await parseResponse(tokenResponse);
    const shortAccessToken = String(shortLived.access_token);

    // 2. Exchange short-lived token for long-lived access token (60 days validity)
    const longLivedQuery = new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: clientSecret,
      access_token: shortAccessToken,
    });

    const longLivedResponse = await fetch(`${graphBase}/access_token?${longLivedQuery.toString()}`);
    const longLived = await parseResponse(longLivedResponse);

    const accessToken = String(longLived.access_token || shortAccessToken);
    const expiresIn = typeof longLived.expires_in === "number" ? longLived.expires_in : Number(longLived.expires_in || 0);
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined;

    return {
      accessToken,
      refreshToken: accessToken, // Instagram long-lived tokens refresh themselves using grant_type=ig_refresh_token
      expiresAt,
      scope: instagramPermissions.join(","),
    };
  }

  async refreshToken(currentToken: string) {
    const query = new URLSearchParams({
      grant_type: "ig_refresh_token",
      access_token: currentToken,
    });

    const response = await fetch(`${graphBase}/refresh_access_token?${query.toString()}`);
    const body = await parseResponse(response);

    const accessToken = String(body.access_token);
    const expiresIn = typeof body.expires_in === "number" ? body.expires_in : Number(body.expires_in || 0);
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined;

    return {
      accessToken,
      refreshToken: accessToken,
      expiresAt,
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    const response = await fetch(`${graphBase}/me/permissions?access_token=${encodeURIComponent(accessToken)}`, {
      method: "DELETE",
    });
    await parseResponse(response);
  }

  async getAccountInfo(accessToken: string): Promise<OAuthAccount> {
    const response = await fetch(
      `${graphBase}/me?fields=user_id,username,name,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
    );
    const body = await parseResponse(response);

    const accountId = String(body.user_id ?? body.id ?? "");
    const username = typeof body.username === "string" ? body.username : undefined;
    const accountName = typeof body.name === "string" ? body.name : username || "Instagram Account";
    const avatarUrl = typeof body.profile_picture_url === "string" ? body.profile_picture_url : undefined;

    return {
      accountId,
      accountName,
      username,
      avatarUrl,
    };
  }
}