"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Globe, Share2, TrendingUp, Users, Plus, BarChart3 } from "lucide-react";

interface ConnectedChannel {
  id: string;
  account_name: string;
  username?: string;
  status: string;
  platforms?: {
    name: string;
    slug: string;
  };
}

export default function AnalyticsView() {
  const [channels, setChannels] = useState<ConnectedChannel[]>([]);
  const [campaignCount, setCampaignCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [chanRes, campRes, contRes] = await Promise.all([
          fetch("/api/channels"),
          fetch("/api/campaigns"),
          fetch("/api/content"),
        ]);

        if (chanRes.ok) {
          const d = await chanRes.json();
          setChannels(d.channels ?? []);
        }
        if (campRes.ok) {
          const d = await campRes.json();
          setCampaignCount((d.campaigns ?? []).length);
        }
        if (contRes.ok) {
          const d = await contRes.json();
          setContentCount((d.content ?? []).length);
        }
      } catch {
        // Silently continue
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const connectedCount = channels.filter((c) => c.status === "connected").length;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Metric Cards */}
      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-topline">
            <span>Connected Channels</span>
            <span className="stat-icon teal">
              <Globe size={17} />
            </span>
          </div>
          <strong>{String(connectedCount).padStart(2, "0")}</strong>
          <p>{connectedCount > 0 ? "Active publishing targets" : "Connect Pinterest, Medium, etc."}</p>
        </div>
        <div className="stat-card">
          <div className="stat-topline">
            <span>Active Campaigns</span>
            <span className="stat-icon coral">
              <Users size={17} />
            </span>
          </div>
          <strong>{String(campaignCount).padStart(2, "0")}</strong>
          <p>{campaignCount > 0 ? "Configured campaigns" : "No campaigns created yet"}</p>
        </div>
        <div className="stat-card">
          <div className="stat-topline">
            <span>Generated Content</span>
            <span className="stat-icon amber">
              <TrendingUp size={17} />
            </span>
          </div>
          <strong>{String(contentCount).padStart(2, "0")}</strong>
          <p>{contentCount > 0 ? "Drafts and variants" : "Create drafts in Content Studio"}</p>
        </div>
        <div className="stat-card">
          <div className="stat-topline">
            <span>Platform Coverage</span>
            <span className="stat-icon blue">
              <Share2 size={17} />
            </span>
          </div>
          <strong>4</strong>
          <p>Pinterest, Medium, Imgbox, IG</p>
        </div>
      </section>

      {/* Breakdown by Platform */}
      <div className="panel" style={{ padding: 22 }}>
        <div className="panel-heading" style={{ marginBottom: 18 }}>
          <div>
            <h2>Platform Channel Status</h2>
            <p>Publishing connections in your workspace</p>
          </div>
          <Link href="/channels" className="text-button">
            Manage Channels
          </Link>
        </div>

        {channels.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {channels.map((ch) => (
              <div
                key={ch.id}
                style={{
                  padding: 16,
                  borderRadius: 9,
                  border: "1px solid var(--line)",
                  background: "#fafcfc",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <b style={{ fontSize: 13, color: "var(--ink)" }}>{ch.platforms?.name || ch.account_name}</b>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: ch.status === "connected" ? "#168f83" : "#a16e3c",
                      background: ch.status === "connected" ? "#e8f7f4" : "#fff8ef",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {ch.status === "connected" ? "ACTIVE" : "PENDING"}
                  </span>
                </div>
                <div style={{ display: "grid", gap: 6, fontSize: 11, color: "#697b7c" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Account:</span>
                    <b style={{ color: "var(--ink)" }}>{ch.username ? `@${ch.username}` : ch.account_name}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Connection:</span>
                    <b style={{ color: ch.status === "connected" ? "#168f83" : "#a16e3c" }}>
                      {ch.status === "connected" ? "Verified" : "Action Required"}
                    </b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 10px", color: "#8a9899" }}>
            <p style={{ margin: "0 0 14px", fontSize: 12 }}>No platform channels connected yet.</p>
            <Link href="/channels" className="primary-button" style={{ display: "inline-flex" }}>
              <Plus size={15} /> Connect Your First Channel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
