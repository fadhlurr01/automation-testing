"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Plus, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";

interface ScheduledEvent {
  id: string;
  day: number;
  month: number;
  year: number;
  title: string;
  platform: string;
  time: string;
  status: string;
}

const platformColors: Record<string, { bg: string; text: string }> = {
  Pinterest: { bg: "#fff0eb", text: "#df6c47" },
  Medium: { bg: "#eef8f5", text: "#1a8f82" },
  Imgbox: { bg: "#edf3fc", text: "#3d70b8" },
  Instagram: { bg: "#fcedf5", text: "#b03a7a" },
};

export default function CalendarView() {
  const currentDate = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(currentDate.getDate());
  const [events, setEvents] = useState<ScheduledEvent[]>([]);

  useEffect(() => {
    async function loadScheduled() {
      try {
        const response = await fetch("/api/campaigns");
        if (response.ok) {
          const data = await response.json();
          const items: ScheduledEvent[] = [];

          for (const camp of data.campaigns ?? []) {
            if (camp.scheduled_at) {
              const d = new Date(camp.scheduled_at);
              const targets = camp.campaign_targets ?? [];
              for (const target of targets) {
                const platformName = target.connected_accounts?.platforms?.name || "Platform";
                items.push({
                  id: target.id || camp.id,
                  day: d.getDate(),
                  month: d.getMonth(),
                  year: d.getFullYear(),
                  title: camp.name,
                  platform: platformName,
                  time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  status: target.status || camp.status || "scheduled",
                });
              }
            }
          }
          setEvents(items);
        }
      } catch {
        // Silently continue
      }
    }
    loadScheduled();
  }, []);

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  const startDayOffset = (firstDayOfWeek + 6) % 7; // Convert to Monday start

  const selectedEvents = events.filter((e) => e.day === selectedDay);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {/* Calendar Grid */}
      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{monthName} {currentYear}</h2>
            <span style={{ fontSize: 12, color: "#8a9899" }}>{events.length} scheduled publications</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="icon-button" style={{ border: "1px solid var(--line)", borderRadius: 6 }} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <button className="icon-button" style={{ border: "1px solid var(--line)", borderRadius: 6 }} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, textAlign: "center", marginBottom: 8, fontSize: 11, fontWeight: 700, color: "#8a9899" }}>
          <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
        </div>

        {/* Calendar Days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`offset-${i}`} style={{ minHeight: 65, background: "#fafbfb", borderRadius: 8, border: "1px dashed #f0f2f2" }} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayEvents = events.filter((e) => e.day === day);
            const isSelected = selectedDay === day;
            const isToday = day === currentDate.getDate();

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  minHeight: 65,
                  padding: "8px 6px",
                  borderRadius: 8,
                  border: isSelected ? "2px solid #1ba797" : isToday ? "1px solid #78c9be" : "1px solid var(--line)",
                  background: isSelected ? "#f4fbf9" : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "border 0.2s, background 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: isToday || isSelected ? 700 : 500, color: isToday ? "#1ba797" : "inherit" }}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1ba797" }} />
                  )}
                </div>

                <div style={{ display: "grid", gap: 3, marginTop: 4 }}>
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "1px 4px",
                        borderRadius: 3,
                        background: platformColors[ev.platform]?.bg || "#f0f0f0",
                        color: platformColors[ev.platform]?.text || "#333",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ev.platform}
                    </span>
                  ))}
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
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
            Agenda for {monthName} {selectedDay}, {currentYear}
          </h3>
          <Link
            href="/campaigns/new"
            className="text-button"
            style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
          >
            <Plus size={14} /> Schedule
          </Link>
        </div>

        {selectedEvents.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            {selectedEvents.map((ev) => (
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
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: platformColors[ev.platform]?.bg || "#f0f0f0",
                      color: platformColors[ev.platform]?.text || "#333",
                    }}
                  >
                    {ev.platform}
                  </span>
                  <span style={{ fontSize: 10, color: "#8a9899", display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={11} /> {ev.time}
                  </span>
                </div>
                <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600 }}>{ev.title}</h4>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: ev.status === "published" ? "#1a8f82" : "#a16e3c" }}>
                  {ev.status === "published" ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  <span>{ev.status === "published" ? "Published" : "Scheduled publication"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 10px", color: "#8a9899" }}>
            <CalendarIcon size={28} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: 12 }}>No publications scheduled for this day.</p>
            <Link
              href="/campaigns/new"
              className="primary-button"
              style={{ margin: "16px auto 0", display: "inline-flex" }}
            >
              <Plus size={15} /> Schedule campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
