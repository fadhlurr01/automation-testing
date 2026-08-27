import CampaignBuilder from "@/components/campaign-builder";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) { return <CampaignBuilder campaignId={(await params).id} />; }