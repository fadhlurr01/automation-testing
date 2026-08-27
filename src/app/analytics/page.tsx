import AppShell from "@/components/app-shell";
import AnalyticsView from "@/components/analytics-view";

export default function AnalyticsPage() {
  return (
    <AppShell
      active="Analytics"
      title="Performance & Insights"
      eyebrow="DISTRIBUTION METRICS"
      description="Track impressions, audience engagement, and publishing performance across all active channels."
      showBack={true}
    >
      <AnalyticsView />
    </AppShell>
  );
}
