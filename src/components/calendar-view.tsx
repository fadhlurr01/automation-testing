"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Plus, Target, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";

interface ScheduledEvent {
  id: string;
  day: number;
  title: string;
  platform: "Pinterest" | "Medium" | "Imgbox" | "Instagram";
  time: string;
  status: "SCHEDULED" | "PUBLISHED";
}

const scheduledEvents: ScheduledEvent[] = [
  { id: "e1", day: 27, title: "Automation Hub Launch", platform: "Medium", time: "10:00 AM", status: "PUBLISHED" },
  { id: "e2", day: 28, title: "Modern Design Assets #12", platform: "Pinterest", time: "01:30 PM", status: "SCHEDULED" },
  { id: "e3", day: 28, title: "Infographic High-Res", platform: "Imgbox", time: "04:00 PM", status: "SCHEDULED" },
  { id: "e4", day: 29, title: "Developer Tools Feature", platform: "Medium", time: "11:00 AM", status: "SCHEDULED" },
  { id: "e5", day: 31, title: "Product Teaser Clip", platform: "Pinterest", time: "09:00 AM", status: "SCHEDULED" },
];

const platformColors: Record<string, { bg: string; text: string }> = {
  Pinterest: { bg: "#fff0eb", text: "#df6c47" },
  Medium: { bg: "#eef8f5", text: "#1a8f82" },
  Imgbox: { bg: "#edf3fc", text: "#3d70b8" },
  Instagram: { bg: "#fcedf5", text: "#b03a7a" },
};

export default function CalendarView() {
  const [selectedDay, setSelectedDay] = useState<number>(28);

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const startDayOffset = 5; // August 2026 starts on Saturday (5 padding days)

  const selectedEvents = scheduledEvents.filter((e) => e.day === selectedDay);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px, 340px)", gap: 20 }}>
      {/* Calendar Grid */}
      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>August 2026</h2>
            <span style={{ fontSize: 12, color: "#8a9899" }}>5 scheduled publications</span>
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
            <div key={`offset-${i}`} style={{ minHeight: 70, background: "#fafbfb", borderRadius: 8, border: "1px dashed #f0f2f2" }} />
          ))}

          {daysInMonth.map((day) => {
            const dayEvents = scheduledEvents.filter((e) => e.day === day);
            const isSelected = selectedDay === day;
            const isToday = day === 27;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  minHeight: 70,
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
            Agenda for Aug {selectedDay}, 2026
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
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: ev.status === "PUBLISHED" ? "#1a8f82" : "#a16e3c" }}>
                  {ev.status === "PUBLISHED" ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  <span>{ev.status === "PUBLISHED" ? "Published successfully" : "Queued for automated publishing"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 10px", color: "#8a9899" }}>
            <CalendarIcon size={28} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: 12 }}>No publications scheduled for August {selectedDay}.</p>
            <Link
              href="/campaigns/new"
              className="primary-button"
              style={{ margin: "16px auto 0", display: "inline-flex" }}
            >
              <Plus size={15} /> Add Campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
