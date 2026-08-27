"use client";

import AppShell from "@/components/app-shell";
import PublishCenter from "@/components/publish-center";

export default function PublishPage() {
  return (
    <AppShell
      active="Publish Center"
      title="Publish Center"
      eyebrow="DISTRIBUTION COMMAND CENTER"
      description="Review pre-flight validation, platform-tailored variants, and execute automated multi-channel publishing."
      showBack={true}
    >
      <PublishCenter />
    </AppShell>
  );
}
