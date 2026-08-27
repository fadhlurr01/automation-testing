import AppShell from "@/components/app-shell";
import ChannelManager from "@/components/channel-manager";

export default function ChannelsPage() {
  return (
    <AppShell
      active="Channels"
      title="Publishing Channels"
      eyebrow="CAPABILITY REGISTRY"
      description="Connect, test, and manage OAuth & API publishing destinations for automated content distribution."
      showBack={true}
    >
      <ChannelManager />
    </AppShell>
  );
}
