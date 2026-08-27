import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOAuthProvider } from "@/lib/oauth/provider";

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const provider = getOAuthProvider(platform);
  if (!provider) return NextResponse.json({ error: "Developer configuration required", code: "OAUTH_PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  const state = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  const redirectUri = new URL(`/api/oauth/${platform}/callback`, request.url).toString();
  const authorizationUrl = provider.getAuthorizationUrl({ state, redirectUri });
  if (new URL(request.url).searchParams.get("format") === "json") return NextResponse.json({ authorizationUrl });
  return NextResponse.redirect(authorizationUrl);
}
