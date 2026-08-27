import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOAuthProvider } from "@/lib/oauth/provider";
import { encryptToken } from "@/lib/oauth/tokens";

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params; const url = new URL(request.url); const code = url.searchParams.get("code"); const state = url.searchParams.get("state");
  const cookieStore = await cookies(); const expectedState = cookieStore.get("oauth_state")?.value; cookieStore.delete("oauth_state");
  if (!state || !expectedState || state !== expectedState) return NextResponse.redirect(new URL("/channels?oauth_error=invalid_state", request.url));
  if (!code) return NextResponse.redirect(new URL("/channels?oauth_error=missing_code", request.url));
  const provider = getOAuthProvider(platform); if (!provider) return NextResponse.redirect(new URL("/channels?oauth_error=developer_configuration_required", request.url));
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.redirect(new URL("/login", request.url));
  try {
    const redirectUri = new URL(`/api/oauth/${platform}/callback`, request.url).toString(); const tokens = await provider.handleCallback({ code, redirectUri }); const account = await provider.getAccountInfo(tokens.accessToken);
    const admin = createSupabaseAdminClient(); const { data: membership } = await admin.from("users").select("organization_id").eq("id", user.id).single(); const { data: platformRow } = await admin.from("platforms").select("id").eq("slug", platform).single();
    if (!membership || !platformRow) throw new Error("Workspace or platform not found.");
    const { data: connected, error } = await admin.from("connected_accounts").upsert({ organization_id: membership.organization_id, platform_id: platformRow.id, account_id: account.accountId, account_name: account.accountName, username: account.username, avatar_url: account.avatarUrl, status: "connected" }, { onConflict: "platform_id,account_id" }).select("id").single(); if (error) throw error;
    const { error: tokenError } = await admin.from("oauth_tokens").upsert({ connected_account_id: connected.id, access_token_encrypted: encryptToken(tokens.accessToken), refresh_token_encrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null, expires_at: tokens.expiresAt ?? null, scope: tokens.scope ?? null }, { onConflict: "connected_account_id" }); if (tokenError) throw tokenError;
    return NextResponse.redirect(new URL("/channels?oauth=connected", request.url));
  } catch { return NextResponse.redirect(new URL("/channels?oauth_error=connection_failed", request.url)); }
}
