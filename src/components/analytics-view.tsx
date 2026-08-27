"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Globe,
  Share2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  Filter,
  Eye,
  Heart,
  MousePointerClick,
  Info,
} from "lucide-react";

interface PlatformMetric {
  slug: string;
  name: string;
  category: string;
  connected: boolean;
  publishedCount: number;
  failedCount: number;
  reach: number | null;
  reachSupported: boolean;
  engagement: number | null;
  engagementSupported: boolean;
  clicks: number | null;
  clicksSupported: boolean;
  notes?: string;
}

interface AnalyticsSummary {
  totalCampaigns: number;
  publishedPosts: number;
  failedPosts: number;
  connectedChannels: number;
  totalReach: number;
  totalEngagement: number;
  totalClicks: number;
}

interface CampaignTargetItem {
  id: string;
  status: string;
  connected_accounts?: {
    account_name: string;
    username?: string;
    platforms?: {
      name: string;
      slug: string;
    };
  };
}

interface CampaignAnalyticsItem {
  id: string;
  name: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  campaign_targets?: CampaignTargetItem[];
}

export default function AnalyticsView() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalCampaigns: 0,
    publishedPosts: 0,
    failedPosts: 0,
    connectedChannels: 0,
    totalReach: 0,
    totalEngagement: 0,
    totalClicks: 0,
  });
  const [platforms, setPlatforms] = useState<PlatformMetric[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    setLoading(true);
    try {
      let query = `?range=${dateRange}`;
      if (dateRange === "custom" && customStart) {
        query += `&startDate=${customStart}`;
        if (customEnd) query += `&endDate=${customEnd}`;
      }

      const response = await fetch(`/api/analytics${query}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setPlatforms(data.platforms ?? []);
        setCampaigns(data.campaigns ?? []);
      }
    } catch {
      // Continue gracefully
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  function applyCustomFilter(e: React.FormEvent) {
    e.preventDefault();
    loadAnalytics();
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Date Filter & Range Header */}
      <section
        className="panel"
        style={{
          padding: "16px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={18} color="#159c8e" />
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>
              Analytics Timeframe
            </h2>
            <small style={{ color: "#697b7c" }}>
              Filter workspace metrics and performance history
            </small>
          </div>
        </div>

        {/* Date Filter Buttons */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { id: "7d", label: "7 days" },
            { id: "30d", label: "30 days" },
            { id: "90d", label: "90 days" },
            { id: "custom", label: "Custom" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setDateRange(t.id as any)}
              className={dateRange === t.id ? "primary-button" : "text-button"}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: dateRange === t.id ? "none" : "1px solid var(--line)",
                background: dateRange === t.id ? "var(--navy)" : "#fff",
                color: dateRange === t.id ? "#fff" : "#697b7c",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Custom Date Picker (when custom selected) */}
      {dateRange === "custom" && (
        <form
          onSubmit={applyCustomFilter}
          className="panel"
          style={{
            padding: 16,
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
            background: "#fafcfc",
          }}
        >
          <div>
            <label className="field-label">Start Date</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{
                height: 36,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid var(--line)",
                fontSize: 12,
                background: "#fff",
              }}
            />
          </div>
          <div>
            <label className="field-label">End Date</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{
                height: 36,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid var(--line)",
                fontSize: 12,
                background: "#fff",
              }}
            />
          </div>
          <button type="submit" className="primary-button" style={{ height: 36, fontSize: 11, padding: "0 14px" }}>
            <Filter size={13} /> Apply Range
          </button>
        </form>
      )}

      {/* Summary Stat Grid */}
      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-topline">
            <span>Total Campaigns</span>
            <span className="stat-icon teal">
              <Layers size={17} />
            </span>
          </div>
          <strong>{String(summary.totalCampaigns).padStart(2, "0")}</strong>
          <p>{summary.totalCampaigns > 0 ? "Configured campaigns" : "No campaigns created"}</p>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span>Published Posts</span>
            <span className="stat-icon mint">
              <CheckCircle2 size={17} />
            </span>
          </div>
          <strong>{String(summary.publishedPosts).padStart(2, "0")}</strong>
          <p>Confirmed publications</p>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span>Failed Posts</span>
            <span className="stat-icon coral">
              <AlertCircle size={17} />
            </span>
          </div>
          <strong>{String(summary.failedPosts).padStart(2, "0")}</strong>
          <p>{summary.failedPosts > 0 ? "Requires review / retry" : "Zero delivery failures"}</p>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span>Connected Channels</span>
            <span className="stat-icon blue">
              <Globe size={17} />
            </span>
          </div>
          <strong>{String(summary.connectedChannels).padStart(2, "0")}</strong>
          <p>Active publishing targets</p>
        </div>
      </section>

      {/* Aggregate Audience Performance (where supported) */}
      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-topline">
            <span>Audience Reach</span>
            <span className="stat-icon teal">
              <Eye size={17} />
            </span>
          </div>
          <strong>{summary.totalReach > 0 ? summary.totalReach.toLocaleString() : "0"}</strong>
          <p>Supported platforms (Instagram, Pinterest, Facebook)</p>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span>Total Engagements</span>
            <span className="stat-icon amber">
              <Heart size={17} />
            </span>
          </div>
          <strong>{summary.totalEngagement > 0 ? summary.totalEngagement.toLocaleString() : "0"}</strong>
          <p>Saves, likes, comments & pin clicks</p>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span>Outbound Clicks</span>
            <span className="stat-icon blue">
              <MousePointerClick size={17} />
            </span>
          </div>
          <strong>{summary.totalClicks > 0 ? summary.totalClicks.toLocaleString() : "0"}</strong>
          <p>Destination traffic driven</p>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span>Platform Coverage</span>
            <span className="stat-icon violet">
              <Share2 size={17} />
            </span>
          </div>
          <strong>{platforms.length}</strong>
          <p>Active platform adapters</p>
        </div>
      </section>

      {/* Platform-Level Analytics Breakdown */}
      <section className="panel" style={{ padding: 24 }}>
        <div className="panel-heading" style={{ marginBottom: 18 }}>
          <div>
            <h2>Platform Breakdown & API Metrics</h2>
            <p>
              Metrics are strictly sourced from official platform APIs. Platforms without public analytics API endpoints display &quot;Not available through API&quot;.
            </p>
          </div>
          <Link href="/channels" className="text-button">
            Manage Channels <ArrowUpRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", color: "#8a9899", fontSize: 11 }}>
                <th style={{ padding: "10px 12px" }}>PLATFORM</th>
                <th style={{ padding: "10px 12px" }}>STATUS</th>
                <th style={{ padding: "10px 12px" }}>PUBLISHED</th>
                <th style={{ padding: "10px 12px" }}>FAILED</th>
                <th style={{ padding: "10px 12px" }}>REACH</th>
                <th style={{ padding: "10px 12px" }}>ENGAGEMENT</th>
                <th style={{ padding: "10px 12px" }}>CLICKS</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((p) => (
                <tr
                  key={p.slug}
                  style={{
                    borderBottom: "1px solid #f0f4f4",
                    transition: "background 0.2s",
                  }}
                >
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <b style={{ fontSize: 13, color: "var(--navy)" }}>{p.name}</b>
                      <span style={{ fontSize: 10, color: "#8a9899" }}>({p.category})</span>
                    </div>
                  </td>

                  <td style={{ padding: "14px 12px" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: p.connected ? "#e6f7f3" : "#f3f5f5",
                        color: p.connected ? "#159c8e" : "#8a9899",
                      }}
                    >
                      {p.connected ? "CONNECTED" : "NOT CONNECTED"}
                    </span>
                  </td>

                  <td style={{ padding: "14px 12px" }}>
                    <b>{p.publishedCount}</b>
                  </td>

                  <td style={{ padding: "14px 12px" }}>
                    <span style={{ color: p.failedCount > 0 ? "#cf1322" : "#8a9899", fontWeight: p.failedCount > 0 ? 700 : 400 }}>
                      {p.failedCount}
                    </span>
                  </td>

                  {/* Reach Column */}
                  <td style={{ padding: "14px 12px" }}>
                    {p.reachSupported ? (
                      <b>{p.reach !== null ? p.reach.toLocaleString() : "0"}</b>
                    ) : (
                      <span style={{ color: "#8a9899", fontSize: 11, fontStyle: "italic", display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Info size={11} /> Not available through API
                      </span>
                    )}
                  </td>

                  {/* Engagement Column */}
                  <td style={{ padding: "14px 12px" }}>
                    {p.engagementSupported ? (
                      <b>{p.engagement !== null ? p.engagement.toLocaleString() : "0"}</b>
                    ) : (
                      <span style={{ color: "#8a9899", fontSize: 11, fontStyle: "italic", display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Info size={11} /> Not available through API
                      </span>
                    )}
                  </td>

                  {/* Clicks Column */}
                  <td style={{ padding: "14px 12px" }}>
                    {p.clicksSupported ? (
                      <b>{p.clicks !== null ? p.clicks.toLocaleString() : "0"}</b>
                    ) : (
                      <span style={{ color: "#8a9899", fontSize: 11, fontStyle: "italic", display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Info size={11} /> Not available through API
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Campaign-Level Analytics */}
      <section className="panel" style={{ padding: 24 }}>
        <div className="panel-heading" style={{ marginBottom: 18 }}>
          <div>
            <h2>Campaign-Level Analytics</h2>
            <p>Performance breakdown per multi-channel distribution campaign</p>
          </div>
          <Link href="/campaigns" className="text-button">
            View All Campaigns <ArrowUpRight size={14} />
          </Link>
        </div>

        {campaigns.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            {campaigns.map((camp) => {
              const targets = camp.campaign_targets ?? [];
              const published = targets.filter((t) => t.status === "published").length;
              const failed = targets.filter((t) => t.status === "failed").length;
              const total = targets.length;
              const channels = Array.from(
                new Set(
                  targets.map((t) => t.connected_accounts?.platforms?.name).filter(Boolean)
                )
              );

              return (
                <div
                  key={camp.id}
                  style={{
                    padding: "16px 18px",
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
                  <div style={{ minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: camp.status === "approved" || camp.status === "published" ? "#e6f7f3" : "#f3f5f5",
                          color: camp.status === "approved" || camp.status === "published" ? "#159c8e" : "#697b7c",
                          textTransform: "uppercase",
                        }}
                      >
                        {camp.status || "DRAFT"}
                      </span>
                      <span style={{ fontSize: 11, color: "#8a9899" }}>
                        Created {new Date(camp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>{camp.name}</h3>
                    {channels.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {channels.map((ch) => (
                          <span
                            key={ch}
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              background: "#f0f4f4",
                              padding: "2px 6px",
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

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, textAlign: "center" }}>
                    <div>
                      <small style={{ color: "#8a9899", fontSize: 10 }}>TOTAL TARGETS</small>
                      <b style={{ display: "block", fontSize: 14 }}>{total}</b>
                    </div>
                    <div>
                      <small style={{ color: "#159c8e", fontSize: 10 }}>PUBLISHED</small>
                      <b style={{ display: "block", fontSize: 14, color: "#159c8e" }}>{published}</b>
                    </div>
                    <div>
                      <small style={{ color: failed > 0 ? "#cf1322" : "#8a9899", fontSize: 10 }}>FAILED</small>
                      <b style={{ display: "block", fontSize: 14, color: failed > 0 ? "#cf1322" : "#8a9899" }}>
                        {failed}
                      </b>
                    </div>
                  </div>

                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="text-button"
                    style={{ fontSize: 11, color: "#168f83" }}
                  >
                    Details <ArrowUpRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 10px", color: "#8a9899" }}>
            <p style={{ margin: "0 0 10px", fontSize: 12 }}>No campaign activity found in this timeframe.</p>
            <Link href="/campaigns/new" className="primary-button" style={{ display: "inline-flex", fontSize: 11 }}>
              Create Campaign
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
