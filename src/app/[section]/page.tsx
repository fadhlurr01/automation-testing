import AppShell from "@/components/app-shell";
import AutomationHub from "@/components/automation-hub";
import AIContentStudio from "@/components/ai-content-studio";
import ChannelManager from "@/components/channel-manager";
import CampaignsList from "@/components/campaigns-list";
import CalendarView from "@/components/calendar-view";
import MediaLibrary from "@/components/media-library";
import AIStudioView from "@/components/ai-studio-view";
import AnalyticsView from "@/components/analytics-view";

const sectionTitles: Record<string, { active: string; title: string; eyebrow: string; description: string }> = {
  campaigns: {
    active: "Campaigns",
    title: "Campaign Management",
    eyebrow: "DISTRIBUTION PIPELINES",
    description: "Plan, organize, and automate multi-channel campaigns across your connected publishing platforms.",
  },
  "content-studio": {
    active: "Content Studio",
    title: "Content Studio",
    eyebrow: "CREATIVE WORKSPACE",
    description: "Create, adapt, and refine your content drafts and assets for multi-platform distribution.",
  },
  channels: {
    active: "Channels",
    title: "Publishing Channels",
    eyebrow: "CAPABILITY REGISTRY",
    description: "Connect, test, and manage OAuth & API publishing destinations for automated content distribution.",
  },
  calendar: {
    active: "Calendar",
    title: "Publishing Schedule",
    eyebrow: "CONTENT TIMELINE",
    description: "View scheduled, queued, and confirmed publications across all channels in real time.",
  },
  media: {
    active: "Media Library",
    title: "Media Library",
    eyebrow: "ASSET WORKSPACE",
    description: "Upload, preview, and organize your photos and videos for automated publishing.",
  },
  "media-library": {
    active: "Media Library",
    title: "Media Library",
    eyebrow: "ASSET WORKSPACE",
    description: "Upload, preview, and organize your photos and videos for automated publishing.",
  },
  "ai-studio": {
    active: "AI Studio",
    title: "AI Content Generator",
    eyebrow: "CREATIVE ASSISTANT",
    description: "Turn brief ideas into optimized titles, captions, hashtags, and articles tailored for each platform.",
  },
  analytics: {
    active: "Analytics",
    title: "Performance & Insights",
    eyebrow: "DISTRIBUTION METRICS",
    description: "Track impressions, audience engagement, and publishing performance across all active channels.",
  },
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const config = sectionTitles[section.toLowerCase()];

  if (section === "content-studio") {
    return (
      <AppShell active="Content Studio" title={config?.title} eyebrow={config?.eyebrow} description={config?.description} showBack={true}>
        <AIContentStudio />
      </AppShell>
    );
  }

  if (section === "channels") {
    return (
      <AppShell active="Channels" title={config?.title} eyebrow={config?.eyebrow} description={config?.description} showBack={true}>
        <ChannelManager />
      </AppShell>
    );
  }

  if (section === "campaigns") {
    return (
      <AppShell active="Campaigns" title={config?.title} eyebrow={config?.eyebrow} description={config?.description} showBack={true}>
        <CampaignsList />
      </AppShell>
    );
  }

  if (section === "calendar") {
    return (
      <AppShell active="Calendar" title={config?.title} eyebrow={config?.eyebrow} description={config?.description} showBack={true}>
        <CalendarView />
      </AppShell>
    );
  }

  if (section === "media" || section === "media-library") {
    return (
      <AppShell active="Media Library" title={config?.title} eyebrow={config?.eyebrow} description={config?.description} showBack={true}>
        <MediaLibrary />
      </AppShell>
    );
  }

  if (section === "ai-studio") {
    return (
      <AppShell active="AI Studio" title={config?.title} eyebrow={config?.eyebrow} description={config?.description} showBack={true}>
        <AIStudioView />
      </AppShell>
    );
  }

  if (section === "analytics") {
    return (
      <AppShell active="Analytics" title={config?.title} eyebrow={config?.eyebrow} description={config?.description} showBack={true}>
        <AnalyticsView />
      </AppShell>
    );
  }

  return <AutomationHub active={config?.active ?? section} />;
}