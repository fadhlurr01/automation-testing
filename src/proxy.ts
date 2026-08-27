import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = ["/login", "/register", "/forgot-password", "/auth/callback"];

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;
  if (publicPaths.some((publicPath) => path.startsWith(publicPath))) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "supabase_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const { createServerClient } = await import("@supabase/ssr");
  const supabase = createServerClient(url, key, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => undefined },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };