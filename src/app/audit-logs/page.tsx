"use client";

import AppShell from "@/components/app-shell";
import AuditLogView from "@/components/audit-log-view";

export default function AuditLogsPage() {
  return (
    <AppShell
      active="Audit Logs"
      title="Audit Logs & Activity Trail"
      eyebrow="SECURITY & AUDITING"
      description="Immutable activity history tracking user actions, media uploads, AI creations, and platform delivery results."
      showBack={true}
    >
      <AuditLogView />
    </AppShell>
  );
}
