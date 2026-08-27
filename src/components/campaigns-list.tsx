"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Target, CheckCircle2, Clock, Calendar, ArrowUpRight, Search, Filter, MoreHorizontal } from "lucide-react";

interface CampaignItem {
  id: string;
  name: string;
  status: "ACTIVE" | "SCHEDULED" | "DRAFT" | "COMPLETED";
  channels: string[];
  scheduledDate: string;
  progress: number;
  publishedCount: number;
  totalCount: number;
}

const mockCampaigns: CampaignItem[] = [
  {
    id: "camp-1",
    name: "Spring Product Launch 2026",
    status: "ACTIVE",
    channels: ["Instagram", "Pinterest", "Medium"],
    scheduledDate: "Aug 28, 2026 · 10:00 AM",
    progress: 75,
    publishedCount: 3,
    totalCount: 4,
  },
  {
    id: "camp-2",
    name: "Developer Tools Feature Spotlight",
    status: "SCHEDULED",
    channels: ["Medium", "Pinterest", "Imgbox"],
    scheduledDate: "Aug 29, 2026 · 02:30 PM",
    progress: 0,
    publishedCount: 0,
    totalCount: 3,
  },
  {
    id: "camp-3",
    name: "Weekly Design Inspiration #42",
    status: "DRAFT",
    channels: ["Pinterest", "Imgbox"],
    scheduledDate: "Sep 01, 2026 · 09:00 AM",
    progress: 30,
    publishedCount: 0,
    totalCount: 2,
  },
  {
    id: "camp-4",
    name: "Automation Hub Launch Announcement",
    status: "COMPLETED",
    channels: ["Medium", "Instagram", "Pinterest"],
    scheduledDate: "Aug 25, 2026 · 08:00 AM",
    progress: 100,
    publishedCount: 3,
    totalCount: 3,
  },
];

export default function CampaignsList() {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filtered = mockCampaigns.filter((c) => {
    const matchesFilter = filter === "ALL" || c.status === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="campaigns-workspace">
      <div className="channel-toolbar" style={{ marginBottom: 20 }}>
        <div className="channel-search">
          <Search size={17} />
          <input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL", "ACTIVE", "SCHEDULED", "DRAFT", "COMPLETED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={filter === tab ? "primary-button" : "text-button"}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                border: filter === tab ? "none" : "1px solid var(--line)",
                background: filter === tab ? "var(--navy)" : "#fff",
                color: filter === tab ? "#fff" : "#697b7c",
              }}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {filtered.map((camp) => (
          <article
            key={camp.id}
            className="stat-card"
            style={{
              padding: "20px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 240, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    background:
                      camp.status === "ACTIVE"
                        ? "#e6f7f3"
                        : camp.status === "SCHEDULED"
                        ? "#fff5df"
                        : camp.status === "COMPLETED"
                        ? "#edf3fc"
                        : "#f3f5f5",
                    color:
                      camp.status === "ACTIVE"
                        ? "#159c8e"
                        : camp.status === "SCHEDULED"
                        ? "#d89a3f"
                        : camp.status === "COMPLETED"
                        ? "#4874b8"
                        : "#778587",
                  }}
                >
                  {camp.status}
                </span>
                <span style={{ fontSize: 11, color: "#8a9899", display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={13} /> {camp.scheduledDate}
                </span>
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>
                {camp.name}
              </h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {camp.channels.map((ch) => (
                  <span
                    key={ch}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      background: "#f0f4f4",
                      padding: "2px 7px",
                      borderRadius: 4,
                      color: "#4e6365",
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ minWidth: 160, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#778587" }}>
                <span>Publishing progress</span>
                <b>{camp.publishedCount}/{camp.totalCount} ({camp.progress}%)</b>
              </div>
              <div style={{ height: 6, background: "#e8eff0", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${camp.progress}%`,
                    background: camp.progress === 100 ? "#1aa999" : "#19383b",
                    borderRadius: 4,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link
                href={`/campaigns/${camp.id}`}
                className="text-button"
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                  background: "#fff",
                  color: "#2a4345",
                  fontWeight: 600,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Review <ArrowUpRight size={14} />
              </Link>
            </div>
          </article>
        ))}

        {!filtered.length && (
          <div className="empty-state panel" style={{ width: "100%", margin: "20px 0" }}>
            <span className="empty-icon"><Target size={22} /></span>
            <h2>No campaigns match your filter</h2>
            <p>Create a new multi-channel campaign to distribute your content across Pinterest, Medium, Imgbox, and Instagram.</p>
            <Link href="/campaigns/new" className="primary-button">
              <Plus size={17} /> Create campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
