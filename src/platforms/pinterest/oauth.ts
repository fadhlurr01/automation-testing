import type { OAuthAccount, OAuthProvider } from "@/lib/oauth/provider";
import { normalizePinterestError } from "./errors";
import { pinterestPermissions } from "./capabilities";

const oauthBase = "https://www.pinterest.com/oauth";
const apiBase = "https://api.pinterest.com/v5";

function getOAuthConfig() {
  const clientId = process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_APP_SECRET || process.env.PINTEREST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Developer configuration required: PINTEREST_APP_ID and PINTEREST_APP_SECRET are missing.");
  }

  return { clientId, clientSecret };
}

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw normalizePinterestError(body);
  }
  return body as Record<string, unknown>;
}

export class PinterestOAuthProvider implements OAuthProvider {
  getAuthorizationUrl({ state, redirectUri }: { state: string; redirectUri: string }): string {
    const { clientId } = getOAuthConfig();
    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: pinterestPermissions.join(","),
      state,
    });

    return `${oauthBase}/?${query.toString()}`;
  }

  async handleCallback({ code, redirectUri }: { code: string; redirectUri: string }) {
    const { clientId, clientSecret } = getOAuthConfig();
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

    const bodyParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(`${apiBase}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: bodyParams,
    });

    const data = await parseResponse(response);
    const accessToken = String(data.access_token);
    const refreshToken = typeof data.refresh_token === "string" ? data.refresh_token : undefined;
    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : Number(data.expires_in || 0);
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined;

    return {
      accessToken,
      refreshToken,
      expiresAt,
      scope: typeof data.scope === "string" ? data.scope : pinterestPermissions.join(","),
    };
  }

  async refreshToken(refreshToken: string) {
    const { clientId, clientSecret } = getOAuthConfig();
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

    const bodyParams = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(`${apiBase}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: bodyParams,
    });

    const data = await parseResponse(response);
    const accessToken = String(data.access_token);
    const newRefreshToken = typeof data.refresh_token === "string" ? data.refresh_token : refreshToken;
    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : Number(data.expires_in || 0);
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined;

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    };
  }

  async revokeToken(_accessToken: string): Promise<void> {
    // Pinterest OAuth v5 token lifecycle revocation
  }

  async getAccountInfo(accessToken: string): Promise<OAuthAccount> {
    const response = await fetch(`${apiBase}/user_account`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await parseResponse(response);
    const accountId = String(data.username || data.id || "");
    const username = typeof data.username === "string" ? data.username : undefined;
    const accountName = typeof data.business_name === "string" ? data.business_name : username || "Pinterest Account";
    const avatarUrl = typeof data.profile_image === "string" ? data.profile_image : undefined;

    return {
      accountId,
      accountName,
      username,
      avatarUrl,
    };
  }
}
