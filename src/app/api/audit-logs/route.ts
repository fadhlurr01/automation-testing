import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuditLogs, recordAuditLog, AuditAction } from "@/lib/audit/audit-logger";

export async function GET(request: Request) {
  try {
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

    const url = new URL(request.url);
    const action = url.searchParams.get("action") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);

    const logs = await getAuditLogs({
      organizationId: membership?.organization_id,
      action,
      limit,
    });

    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load audit logs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: membership } = await supabase
      .from("users")
      .select("organization_id, full_name, email")
      .eq("id", user.id)
      .single();

    const body = await request.json().catch(() => ({}));
    const action: AuditAction = body.action || "SETTINGS_CHANGE";
    const description: string = body.description || "Action recorded";
    const entityType: string = body.entityType || "general";
    const status: "SUCCESS" | "FAILURE" | "WARNING" | "INFO" = body.status || "SUCCESS";

    const entry = await recordAuditLog({
      organizationId: membership?.organization_id,
      actorId: user.id,
      actorName: membership?.full_name || user.email?.split("@")[0] || "User",
      action,
      entityType,
      entityId: body.entityId,
      description,
      details: body.details,
      status,
    });

    return NextResponse.json({ log: entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record audit log." },
      { status: 500 }
    );
  }
}
