import type { OAuthAccount, OAuthProvider } from "@/lib/oauth/provider";
import { normalizeMediumError } from "./errors";
import { mediumPermissions } from "./capabilities";

const oauthBase = "https://medium.com/m/oauth/authorize";
const apiBase = "https://api.medium.com/v1";

function getOAuthConfig() {
  const clientId = process.env.MEDIUM_CLIENT_ID;
  const clientSecret = process.env.MEDIUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Developer configuration required: MEDIUM_CLIENT_ID and MEDIUM_CLIENT_SECRET are missing.");
  }

  return { clientId, clientSecret };
}

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw normalizeMediumError(body);
  }
  return body as Record<string, unknown>;
}

export class MediumOAuthProvider implements OAuthProvider {
  getAuthorizationUrl({ state, redirectUri }: { state: string; redirectUri: string }): string {
    const { clientId } = getOAuthConfig();
    const query = new URLSearchParams({
      client_id: clientId,
      scope: mediumPermissions.join(","),
      state,
      response_type: "code",
      redirect_uri: redirectUri,
    });

    return `${oauthBase}?${query.toString()}`;
  }

  async handleCallback({ code, redirectUri }: { code: string; redirectUri: string }) {
    const { clientId, clientSecret } = getOAuthConfig();

    const response = await fetch(`${apiBase}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const data = await parseResponse(response);
    const accessToken = String(data.access_token);
    const refreshToken = typeof data.refresh_token === "string" ? data.refresh_token : undefined;
    const expiresIn = typeof data.expires_at === "number" ? data.expires_at : undefined;
    const expiresAt = expiresIn ? new Date(expiresIn).toISOString() : undefined;

    return {
      accessToken,
      refreshToken,
      expiresAt,
      scope: typeof data.scope === "string" ? data.scope : mediumPermissions.join(","),
    };
  }

  async refreshToken(refreshToken: string) {
    const { clientId, clientSecret } = getOAuthConfig();

    const response = await fetch(`${apiBase}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
      }),
    });

    const data = await parseResponse(response);
    const accessToken = String(data.access_token);
    const newRefreshToken = typeof data.refresh_token === "string" ? data.refresh_token : refreshToken;
    const expiresIn = typeof data.expires_at === "number" ? data.expires_at : undefined;
    const expiresAt = expiresIn ? new Date(expiresIn).toISOString() : undefined;

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    };
  }

  async revokeToken(_accessToken: string): Promise<void> {
    // Medium does not support programmatic token revocation endpoint
  }

  async getAccountInfo(accessToken: string): Promise<OAuthAccount> {
    const response = await fetch(`${apiBase}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const result = await parseResponse(response);
    const data = (result.data || {}) as Record<string, unknown>;

    const accountId = String(data.id || "");
    const username = typeof data.username === "string" ? data.username : undefined;
    const accountName = typeof data.name === "string" ? data.name : username || "Medium Author";
    const avatarUrl = typeof data.imageUrl === "string" ? data.imageUrl : undefined;

    return {
      accountId,
      accountName,
      username,
      avatarUrl,
    };
  }
}
