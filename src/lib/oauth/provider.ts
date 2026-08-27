import { InstagramOAuthProvider } from "@/platforms/instagram/oauth";

export type OAuthAccount = { accountId: string; accountName: string; username?: string; avatarUrl?: string };

export interface OAuthProvider {
  getAuthorizationUrl(input: { state: string; redirectUri: string }): string;
  handleCallback(input: { code: string; redirectUri: string }): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string; scope?: string }>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string }>;
  revokeToken(accessToken: string): Promise<void>;
  getAccountInfo(accessToken: string): Promise<OAuthAccount>;
}

export function getOAuthProvider(platform: string): OAuthProvider | null {
  return platform === "instagram" ? new InstagramOAuthProvider() : null;
}
