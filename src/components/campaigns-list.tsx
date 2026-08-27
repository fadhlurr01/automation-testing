"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Target, CheckCircle2, Clock, Calendar, ArrowUpRight, Search, Loader2 } from "lucide-react";

interface CampaignTarget {
  id: string;
  status: string;
  scheduled_at: string | null;
  connected_accounts?: {
    id: string;
    account_name: string;
    platforms?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

interface CampaignItem {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  campaign_targets?: CampaignTarget[];
}

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const response = await fetch("/api/campaigns");
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.campaigns ?? []);
        }
      } catch {
        // Continue with empty list if offline or not logged in
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  const filtered = campaigns.filter((c) => {
    const statusUpper = (c.status || "DRAFT").toUpperCase();
    const matchesFilter = filter === "ALL" || statusUpper === filter;
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["ALL", "APPROVED", "SCHEDULED", "DRAFT"].map((tab) => (
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
              {tab === "APPROVED" ? "Active" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a9899" }}>
          <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13 }}>Loading workspace campaigns...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map((camp) => {
            const targets = camp.campaign_targets ?? [];
            const publishedCount = targets.filter((t) => t.status === "published").length;
            const totalCount = targets.length;
            const progress = totalCount > 0 ? Math.round((publishedCount / totalCount) * 100) : 0;
            const statusUpper = (camp.status || "DRAFT").toUpperCase();
            const channels = Array.from(
              new Set(
                targets
                  .map((t) => t.connected_accounts?.platforms?.name || t.connected_accounts?.account_name)
                  .filter(Boolean)
              )
            );

            return (
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
                          statusUpper === "APPROVED"
                            ? "#e6f7f3"
                            : statusUpper === "SCHEDULED"
                            ? "#fff5df"
                            : "#f3f5f5",
                        color:
                          statusUpper === "APPROVED"
                            ? "#159c8e"
                            : statusUpper === "SCHEDULED"
                            ? "#d89a3f"
                            : "#778587",
                      }}
                    >
                      {statusUpper === "APPROVED" ? "ACTIVE" : statusUpper}
                    </span>
                    {camp.scheduled_at && (
                      <span style={{ fontSize: 11, color: "#8a9899", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={13} /> {new Date(camp.scheduled_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>
                    {camp.name}
                  </h3>
                  {channels.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {channels.map((ch) => (
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
                  )}
                </div>

                <div style={{ minWidth: 160, display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#778587" }}>
                    <span>Publishing progress</span>
                    <b>
                      {publishedCount}/{totalCount} ({progress}%)
                    </b>
                  </div>
                  <div style={{ height: 6, background: "#e8eff0", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: progress === 100 ? "#1aa999" : "#19383b",
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
            );
          })}

          {!filtered.length && (
            <div className="empty-state panel" style={{ width: "100%", margin: "20px 0" }}>
              <span className="empty-icon">
                <Target size={22} />
              </span>
              <h2>No campaigns yet</h2>
              <p>
                Create your first multi-channel campaign to distribute your content across Pinterest, Medium, Imgbox, and Instagram.
              </p>
              <Link href="/campaigns/new" className="primary-button">
                <Plus size={17} /> Create your first campaign
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
