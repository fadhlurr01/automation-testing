import AppShell from "@/components/app-shell";
import AIContentStudio from "@/components/ai-content-studio";

export default function ContentStudioPage() {
  return (
    <AppShell
      active="Content Studio"
      title="Content Studio"
      eyebrow="CREATIVE WORKSPACE"
      description="Create, adapt, and refine your content drafts and assets for multi-platform distribution."
      showBack={true}
    >
      <AIContentStudio />
    </AppShell>
  );
}
