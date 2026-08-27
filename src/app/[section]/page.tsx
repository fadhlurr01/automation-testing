import AutomationHub from "@/components/automation-hub";
import AIContentStudio from "@/components/ai-content-studio";
import ChannelManager from "@/components/channel-manager";
import CampaignBuilder from "@/components/campaign-builder";

const labels: Record<string, string> = {
  campaigns: "Campaigns", "content-studio": "Content Studio", channels: "Channels",
  calendar: "Calendar", "media-library": "Media Library", "ai-studio": "AI Studio",
  analytics: "Analytics", settings: "Settings",
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "content-studio") return <AIContentStudio />;
    if (section === "channels") return <ChannelManager />;
    if (section === "campaigns") return <CampaignBuilder />;
  return <AutomationHub active={labels[section] ?? "Dashboard"} />;
}