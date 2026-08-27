"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  List as ListIcon,
  Grid as GridIcon,
  CalendarDays,
  ArrowUpRight,
  Search,
} from "lucide-react";

export type CampaignStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export interface ScheduledEvent {
  id: string;
  campaignId: string;
  name: string;
  platform: string;
  status: CampaignStatus;
  scheduledAt: string; // ISO String
  timezone: string;
  timeDisplay: string;
  dateDisplay: string;
  day: number;
  month: number;
  year: number;
  dayOfWeek: number;
}

const statusConfig: Record<CampaignStatus, { bg: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  draft: { bg: "#f3f5f5", text: "#697b7c", label: "Draft", icon: Clock },
  scheduled: { bg: "#fff7e6", text: "#d48806", label: "Scheduled", icon: Clock },
  publishing: { bg: "#e6f4ff", text: "#1677ff", label: "Publishing", icon: RefreshCw },
  published: { bg: "#e6f7f3", text: "#159c8e", label: "Published", icon: CheckCircle2 },
  failed: { bg: "#fff1f0", text: "#cf1322", label: "Failed", icon: AlertCircle },
};

const platformColors: Record<string, { bg: string; text: string }> = {
  pinterest: { bg: "#fff0eb", text: "#df6c47" },
  medium: { bg: "#eef8f5", text: "#1a8f82" },
  imgbox: { bg: "#edf3fc", text: "#3d70b8" },
  instagram: { bg: "#fcedf5", text: "#b03a7a" },
  facebook: { bg: "#eef2ff", text: "#3b5998" },
  blogger: { bg: "#fff4e6", text: "#e8590c" },
  imgur: { bg: "#ebfbee", text: "#2b8a3e" },
  behance: { bg: "#e7f5ff", text: "#1864ab" },
  deviantart: { bg: "#f8f9fa", text: "#495057" },
};

export default function CalendarView() {
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [campRes, jobRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/publishing/jobs"),
      ]);

      const items: ScheduledEvent[] = [];

      if (campRes.ok) {
        const campData = await campRes.json();
        for (const camp of campData.campaigns ?? []) {
          const rawStatus = (camp.status || "draft").toLowerCase();
          const targetStatus: CampaignStatus =
            rawStatus === "approved" || rawStatus === "published"
              ? "published"
              : rawStatus === "scheduled"
              ? "scheduled"
              : rawStatus === "in_progress" || rawStatus === "publishing"
              ? "publishing"
              : rawStatus === "failed"
              ? "failed"
              : "draft";

          const scheduledIso = camp.scheduled_at || camp.created_at || new Date().toISOString();
          const d = new Date(scheduledIso);
          const targets = camp.campaign_targets ?? [];
          const tz = camp.timezone || "Asia/Jakarta";

          if (targets.length > 0) {
            for (const t of targets) {
              const platformSlug = (
                t.connected_accounts?.platforms?.slug ||
                t.connected_accounts?.platforms?.name ||
                "pinterest"
              ).toLowerCase();

              const tStatus: CampaignStatus =
                t.status === "published"
                  ? "published"
                  : t.status === "failed"
                  ? "failed"
                  : targetStatus;

              items.push({
                id: t.id || `${camp.id}_${platformSlug}`,
                campaignId: camp.id,
                name: camp.name,
                platform: platformSlug,
                status: tStatus,
                scheduledAt: scheduledIso,
                timezone: tz,
                timeDisplay: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                dateDisplay: d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
                day: d.getDate(),
                month: d.getMonth(),
                year: d.getFullYear(),
                dayOfWeek: d.getDay(),
              });
            }
          } else {
            items.push({
              id: camp.id,
              campaignId: camp.id,
              name: camp.name,
              platform: "multi-channel",
              status: targetStatus,
              scheduledAt: scheduledIso,
              timezone: tz,
              timeDisplay: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              dateDisplay: d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
              day: d.getDate(),
              month: d.getMonth(),
              year: d.getFullYear(),
              dayOfWeek: d.getDay(),
            });
          }
        }
      }

      setEvents(items);
    } catch {
      // Continue gracefully
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    const matchesStatus = statusFilter === "ALL" || ev.status.toUpperCase() === statusFilter;
    const matchesSearch =
      ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Date Navigation Helpers
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  const startDayOffset = (firstDayOfWeek + 6) % 7; // Monday start

  function prevPeriod() {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentYear, currentDate.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  }

  function nextPeriod() {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentYear, currentDate.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  }

  function goToday() {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now.getDate());
  }

  // Week View dates helper
  const startOfWeek = new Date(currentDate);
  const dayIndex = (startOfWeek.getDay() + 6) % 7; // 0 for Mon
  startOfWeek.setDate(startOfWeek.getDate() - dayIndex);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const selectedDayEvents = filteredEvents.filter(
    (e) =>
      e.day === selectedDay &&
      e.month === currentDate.getMonth() &&
      e.year === currentDate.getFullYear()
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Calendar Control Bar */}
      <div
        className="panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Left: View Switcher (Month, Week, List) */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ display: "flex", background: "#f0f4f4", padding: 3, borderRadius: 8 }}>
            {[
              { id: "month", label: "Month", icon: CalendarDays },
              { id: "week", label: "Week", icon: GridIcon },
              { id: "list", label: "List", icon: ListIcon },
            ].map((v) => {
              const IconComp = v.icon;
              const isActive = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id as "month" | "week" | "list")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    background: isActive ? "#fff" : "transparent",
                    color: isActive ? "var(--navy)" : "#697b7c",
                    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <IconComp size={14} />
                  {v.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={goToday}
            className="text-button"
            style={{ fontSize: 11, padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 6 }}
          >
            Today
          </button>
        </div>

        {/* Center: Navigation & Period Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={prevPeriod}
            className="icon-button"
            style={{ border: "1px solid var(--line)", borderRadius: 6 }}
            aria-label="Previous period"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, minWidth: 160, textAlign: "center" }}>
            {viewMode === "month" && `${monthName} ${currentYear}`}
            {viewMode === "week" &&
              `${weekDays[0].toLocaleDateString([], { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`}
            {viewMode === "list" && "All Scheduled Campaigns"}
          </h2>
          <button
            onClick={nextPeriod}
            className="icon-button"
            style={{ border: "1px solid var(--line)", borderRadius: 6 }}
            aria-label="Next period"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Search & Create */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="channel-search" style={{ minWidth: 180 }}>
            <Search size={14} />
            <input
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: 12 }}
            />
          </div>

          <Link href="/campaigns/new" className="primary-button" style={{ fontSize: 12, padding: "8px 14px" }}>
            <Plus size={14} /> Schedule Campaign
          </Link>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#697b7c", marginRight: 4 }}>Filter Status:</span>
        {["ALL", "DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              border: statusFilter === s ? "none" : "1px solid var(--line)",
              background: statusFilter === s ? "var(--navy)" : "#fff",
              color: statusFilter === s ? "#fff" : "#697b7c",
              cursor: "pointer",
            }}
          >
            {s === "ALL" ? "All Statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* 1. MONTH VIEW */}
      {viewMode === "month" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {/* Calendar Month Grid */}
          <div className="panel" style={{ padding: 22 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 8,
                textAlign: "center",
                marginBottom: 8,
                fontSize: 11,
                fontWeight: 700,
                color: "#8a9899",
              }}
            >
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div
                  key={`offset-${i}`}
                  style={{ minHeight: 70, background: "#fafbfb", borderRadius: 8, border: "1px dashed #f0f2f2" }}
                />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayEvents = filteredEvents.filter(
                  (e) => e.day === day && e.month === currentDate.getMonth() && e.year === currentDate.getFullYear()
                );
                const isSelected = selectedDay === day;
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentYear === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      minHeight: 70,
                      padding: "8px 6px",
                      borderRadius: 8,
                      border: isSelected
                        ? "2px solid #1ba797"
                        : isToday
                        ? "1px solid #78c9be"
                        : "1px solid var(--line)",
                      background: isSelected ? "#f4fbf9" : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "border 0.2s, background 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isToday || isSelected ? 700 : 500,
                          color: isToday ? "#1ba797" : "inherit",
                        }}
                      >
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1ba797" }} />
                      )}
                    </div>

                    <div style={{ display: "grid", gap: 3, marginTop: 4 }}>
                      {dayEvents.slice(0, 2).map((ev) => {
                        const st = statusConfig[ev.status] || statusConfig.scheduled;
                        return (
                          <span
                            key={ev.id}
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 4px",
                              borderRadius: 3,
                              background: st.bg,
                              color: st.text,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                            }}
                          >
                            {ev.name}
                          </span>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span style={{ fontSize: 8, color: "#8a9899" }}>+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda */}
          <div className="panel" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#168f83", textTransform: "uppercase" }}>
                  Selected Date
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700 }}>
                  {monthName} {selectedDay}, {currentYear}
                </h3>
              </div>
              <span style={{ fontSize: 11, color: "#8a9899" }}>Default TZ: Asia/Jakarta</span>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {selectedDayEvents.map((ev) => {
                  const st = statusConfig[ev.status] || statusConfig.scheduled;
                  const IconComp = st.icon;

                  return (
                    <div
                      key={ev.id}
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: st.bg,
                            color: st.text,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <IconComp size={11} className={ev.status === "publishing" ? "animate-spin" : ""} />
                          {st.label}
                        </span>
                        <span style={{ fontSize: 11, color: "#8a9899", display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={11} /> {ev.timeDisplay} ({ev.timezone})
                        </span>
                      </div>
                      <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>{ev.name}</h4>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: platformColors[ev.platform]?.bg || "#f0f0f0",
                            color: platformColors[ev.platform]?.text || "#333",
                          }}
                        >
                          {ev.platform.toUpperCase()}
                        </span>
                        <Link
                          href={`/campaigns/${ev.campaignId}`}
                          className="text-button"
                          style={{ fontSize: 11, color: "#168f83" }}
                        >
                          View <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "#8a9899" }}>
                <CalendarIcon size={26} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <p style={{ margin: "0 0 12px", fontSize: 12 }}>No campaigns scheduled for this date.</p>
                <Link href="/campaigns/new" className="primary-button" style={{ display: "inline-flex", fontSize: 11 }}>
                  <Plus size={13} /> Schedule New
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === "week" && (
        <div className="panel" style={{ padding: 22 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(130px, 1fr))",
              gap: 12,
              overflowX: "auto",
            }}
          >
            {weekDays.map((d) => {
              const dayNum = d.getDate();
              const isToday = d.toDateString() === new Date().toDateString();
              const dayEvents = filteredEvents.filter(
                (e) =>
                  e.day === dayNum &&
                  e.month === d.getMonth() &&
                  e.year === d.getFullYear()
              );

              return (
                <div
                  key={d.toISOString()}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: isToday ? "#f2faf8" : "#fafcfc",
                    border: isToday ? "1px solid #78c9be" : "1px solid var(--line)",
                    minHeight: 300,
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: 12, borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
                    <b style={{ fontSize: 11, color: "#8a9899", display: "block" }}>
                      {d.toLocaleDateString([], { weekday: "short" }).toUpperCase()}
                    </b>
                    <span style={{ fontSize: 16, fontWeight: 700, color: isToday ? "#1ba797" : "var(--navy)" }}>
                      {dayNum}
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {dayEvents.map((ev) => {
                      const st = statusConfig[ev.status] || statusConfig.scheduled;
                      return (
                        <div
                          key={ev.id}
                          style={{
                            padding: 8,
                            borderRadius: 6,
                            background: "#fff",
                            border: "1px solid var(--line)",
                            fontSize: 11,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "1px 4px",
                              borderRadius: 3,
                              background: st.bg,
                              color: st.text,
                              display: "inline-block",
                              marginBottom: 4,
                            }}
                          >
                            {st.label}
                          </span>
                          <b style={{ display: "block", fontSize: 12, margin: "2px 0 4px" }}>{ev.name}</b>
                          <small style={{ color: "#8a9899", display: "block" }}>
                            {ev.timeDisplay} · {ev.platform}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIST VIEW */}
      {viewMode === "list" && (
        <div className="panel" style={{ padding: 22 }}>
          {filteredEvents.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              {filteredEvents.map((ev) => {
                const st = statusConfig[ev.status] || statusConfig.scheduled;
                const IconComp = st.icon;

                return (
                  <div
                    key={ev.id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: st.bg,
                            color: st.text,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <IconComp size={11} className={ev.status === "publishing" ? "animate-spin" : ""} />
                          {st.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: platformColors[ev.platform]?.bg || "#f0f0f0",
                            color: platformColors[ev.platform]?.text || "#333",
                          }}
                        >
                          {ev.platform.toUpperCase()}
                        </span>
                      </div>
                      <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600 }}>{ev.name}</h3>
                    </div>

                    <div style={{ fontSize: 12, color: "#697b7c" }}>
                      <div><b>Date:</b> {ev.dateDisplay}</div>
                      <div><b>Time:</b> {ev.timeDisplay} ({ev.timezone})</div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href={`/campaigns/${ev.campaignId}`}
                        className="text-button"
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid var(--line)",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Details
                      </Link>
                      <Link
                        href="/publish"
                        className="primary-button"
                        style={{ padding: "6px 12px", fontSize: 11 }}
                      >
                        Publish Center
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a9899" }}>
              <Layers size={30} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>No scheduled campaigns found</h3>
              <p style={{ margin: "0 0 14px", fontSize: 12 }}>Create and schedule your first campaign across platforms.</p>
              <Link href="/campaigns/new" className="primary-button" style={{ display: "inline-flex" }}>
                <Plus size={14} /> Create Campaign
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
