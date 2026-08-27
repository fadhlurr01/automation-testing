import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/oauth/tokens";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });

  const { data, error } = await supabase
    .from("connected_accounts")
    .select(`
      id,
      account_name,
      username,
      status,
      platforms (
        id,
        name,
        slug,
        category,
        supports_image,
        supports_video,
        supports_article,
        supports_link,
        supports_hashtag,
        supports_tags
      )
    `)
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ channels: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: membership } = await admin
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const platformSlug = String(body.platformSlug || body.platform || "").toLowerCase();
    const token = String(body.token || body.accessToken || "").trim();
    let accountName = String(body.accountName || "").trim();
    let username = String(body.username || "").trim();
    let externalAccountId = `account-${Date.now()}`;

    if (!platformSlug) {
      return NextResponse.json({ error: "Platform slug is required." }, { status: 400 });
    }

    // Find platform in database
    let { data: platformRow } = await admin
      .from("platforms")
      .select("id, name, slug")
      .eq("slug", platformSlug)
      .single();

    // If platform row doesn't exist in DB yet, create it
    if (!platformRow) {
      const platformNames: Record<string, string> = {
        pinterest: "Pinterest",
        medium: "Medium",
        imgbox: "Imgbox",
        instagram: "Instagram",
      };
      const { data: newPlatform } = await admin
        .from("platforms")
        .insert({
          name: platformNames[platformSlug] || platformSlug.toUpperCase(),
          slug: platformSlug,
          category: platformSlug === "medium" ? "article" : platformSlug === "imgbox" ? "hosting" : "social",
          supports_image: true,
          supports_video: platformSlug === "instagram" || platformSlug === "pinterest",
          supports_article: platformSlug === "medium",
          supports_link: true,
          supports_hashtag: true,
          supports_tags: true,
        })
        .select("id, name, slug")
        .single();
      platformRow = newPlatform;
    }

    if (!platformRow) {
      return NextResponse.json({ error: `Platform ${platformSlug} is not registered.` }, { status: 400 });
    }

    // Platform-specific verification & profile resolution
    if (platformSlug === "medium") {
      if (token) {
        try {
          const res = await fetch("https://api.medium.com/v1/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            externalAccountId = data.data?.id || externalAccountId;
            username = data.data?.username || username || "medium_user";
            accountName = data.data?.name || accountName || `@${username}`;
          }
        } catch {
          // Network fallback
        }
      }
      accountName = accountName || `@${username || "medium_author"}`;
      username = username || "medium_author";
    } else if (platformSlug === "pinterest") {
      if (token) {
        try {
          const res = await fetch("https://api.pinterest.com/v5/user_account", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            username = data.username || username || "pinterest_user";
            accountName = data.business_name || data.username || accountName || `@${username}`;
          }
        } catch {
          // Fallback
        }
      }
      accountName = accountName || `@${username || "pinterest_creator"}`;
      username = username || "pinterest_creator";
    } else if (platformSlug === "imgbox") {
      // Imgbox does not need token - direct hosting
      accountName = accountName || "Imgbox Direct Host";
      username = username || "imgbox_uploader";
    } else if (platformSlug === "instagram") {
      if (token) {
        try {
          const res = await fetch(`https://graph.facebook.com/v25.0/me?access_token=${encodeURIComponent(token)}`);
          if (res.ok) {
            const data = await res.json();
            externalAccountId = data.id || externalAccountId;
            accountName = data.name || accountName;
          }
        } catch {
          // Fallback
        }
      }
      accountName = accountName || `@${username || "instagram_user"}`;
      username = username || "instagram_user";
    }

    // Save Connected Account
    const { data: connected, error: connErr } = await admin
      .from("connected_accounts")
      .upsert(
        {
          organization_id: membership.organization_id,
          platform_id: platformRow.id,
          account_id: externalAccountId,
          account_name: accountName,
          username: username,
          status: "connected",
        },
        { onConflict: "platform_id,account_id" }
      )
      .select("id, account_name, username, status")
      .single();

    if (connErr) {
      return NextResponse.json({ error: `Failed to save account: ${connErr.message}` }, { status: 400 });
    }

    // Save encrypted token if token provided
    if (token) {
      await admin.from("oauth_tokens").upsert(
        {
          connected_account_id: connected.id,
          access_token_encrypted: encryptToken(token),
          expires_at: null,
          scope: "publish",
        },
        { onConflict: "connected_account_id" }
      );
    }

    return NextResponse.json({
      success: true,
      account: connected,
      message: `${platformRow.name} connected successfully!`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to connect channel." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: membership } = await admin
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!membership) return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Account ID is required." }, { status: 400 });

    await admin.from("oauth_tokens").delete().eq("connected_account_id", id);
    const { error } = await admin
      .from("connected_accounts")
      .delete()
      .eq("id", id)
      .eq("organization_id", membership.organization_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: "Channel disconnected." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to disconnect channel." },
      { status: 500 }
    );
  }
}