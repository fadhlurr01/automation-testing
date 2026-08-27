import AppShell from "@/components/app-shell";
import CampaignsList from "@/components/campaigns-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function CampaignsPage() {
  return (
    <AppShell
      active="Campaigns"
      title="Campaign Management"
      eyebrow="DISTRIBUTION PIPELINES"
      description="Plan, organize, and automate multi-channel campaigns across your connected publishing platforms."
      actionButton={
        <Link className="primary-button" href="/campaigns/new">
          <Plus size={17} />
          Create campaign
        </Link>
      }
    >
      <CampaignsList />
    </AppShell>
  );
}
