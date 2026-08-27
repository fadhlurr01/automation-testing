import AppShell from "@/components/app-shell";
import CalendarView from "@/components/calendar-view";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function CalendarPage() {
  return (
    <AppShell
      active="Calendar"
      title="Publishing Schedule"
      eyebrow="CONTENT TIMELINE"
      description="View scheduled, queued, and confirmed publications across all channels in real time."
      actionButton={
        <Link className="primary-button" href="/campaigns/new">
          <Plus size={17} />
          Schedule publication
        </Link>
      }
      showBack={true}
    >
      <CalendarView />
    </AppShell>
  );
}
