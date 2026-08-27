import AppShell from "@/components/app-shell";
import AIStudioView from "@/components/ai-studio-view";

export default function AIStudioPage() {
  return (
    <AppShell
      active="AI Studio"
      title="AI Content Generator"
      eyebrow="CREATIVE ASSISTANT"
      description="Turn brief ideas into optimized titles, captions, hashtags, and articles tailored for each platform."
      showBack={true}
    >
      <AIStudioView />
    </AppShell>
  );
}
