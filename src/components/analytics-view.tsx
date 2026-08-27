"use client";

import { Activity, ArrowUpRight, BarChart3, Download, Eye, Globe, Share2, Sparkles, TrendingUp, Users } from "lucide-react";

export default function AnalyticsView() {
  const channelStats = [
    { name: "Pinterest", impressions: "142.8k", engagements: "12.4k", ctr: "4.2%", growth: "+24%", color: "#df6c47" },
    { name: "Medium", impressions: "68.2k", engagements: "8.9k", ctr: "6.8%", growth: "+18%", color: "#1a8f82" },
    { name: "Imgbox", impressions: "45.1k", engagements: "3.2k", ctr: "3.1%", growth: "+9%", color: "#3d70b8" },
    { name: "Instagram", impressions: "28.5k", engagements: "2.1k", ctr: "5.4%", growth: "+12%", color: "#b03a7a" },
  ];

  const topPosts = [
    { title: "Building Microservices Architecture in 2026", channel: "Medium", views: "34,200", reactions: "1,840", published: "2 days ago" },
    { title: "Clean Modern Dashboard UI Kit Inspiration", channel: "Pinterest", views: "48,900", reactions: "3,210", published: "3 days ago" },
    { title: "Automation Hub Architecture & API Design", channel: "Medium", views: "19,400", reactions: "920", published: "5 days ago" },
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Metric Cards */}
      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-topline"><span>Total Reach</span><span className="stat-icon teal"><Globe size={17} /></span></div>
          <strong>284.6k</strong>
          <p>+28.4% across all 4 platforms</p>
        </div>
        <div className="stat-card">
          <div className="stat-topline"><span>Total Engagements</span><span className="stat-icon coral"><Users size={17} /></span></div>
          <strong>26.6k</strong>
          <p>+16.2% engagement growth</p>
        </div>
        <div className="stat-card">
          <div className="stat-topline"><span>Average CTR</span><span className="stat-icon amber"><TrendingUp size={17} /></span></div>
          <strong>4.8%</strong>
          <p>Industry benchmark: 2.3%</p>
        </div>
        <div className="stat-card">
          <div className="stat-topline"><span>Active Variants</span><span className="stat-icon blue"><Share2 size={17} /></span></div>
          <strong>142</strong>
          <p>Automated & synchronized</p>
        </div>
      </section>

      {/* Breakdown by Platform */}
      <div className="panel" style={{ padding: 22 }}>
        <div className="panel-heading" style={{ marginBottom: 18 }}>
          <div>
            <h2>Platform Performance Distribution</h2>
            <p>Publishing breakdown across connected channels</p>
          </div>
          <button className="text-button" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {channelStats.map((st) => (
            <div
              key={st.name}
              style={{
                padding: 16,
                borderRadius: 9,
                border: "1px solid var(--line)",
                background: "#fafcfc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <b style={{ fontSize: 13, color: st.color }}>{st.name}</b>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#168f83", background: "#e8f7f4", padding: "2px 6px", borderRadius: 4 }}>
                  {st.growth}
                </span>
              </div>
              <div style={{ display: "grid", gap: 6, fontSize: 11, color: "#697b7c" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Impressions:</span>
                  <b style={{ color: "var(--ink)" }}>{st.impressions}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Engagements:</span>
                  <b style={{ color: "var(--ink)" }}>{st.engagements}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Click-Through:</span>
                  <b style={{ color: "var(--ink)" }}>{st.ctr}</b>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Publications */}
      <div className="panel" style={{ padding: 22 }}>
        <div className="panel-heading" style={{ marginBottom: 16 }}>
          <div>
            <h2>Top Performing Publications</h2>
            <p>Highest reaching automated campaign posts</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {topPosts.map((post) => (
            <div
              key={post.title}
              style={{
                padding: "14px 16px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: post.channel === "Medium" ? "#eef8f5" : "#fff0eb",
                    color: post.channel === "Medium" ? "#1a8f82" : "#df6c47",
                    display: "inline-block",
                    marginBottom: 5,
                  }}
                >
                  {post.channel}
                </span>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{post.title}</h4>
                <small style={{ color: "#8a9899", fontSize: 10 }}>Published {post.published}</small>
              </div>

              <div style={{ display: "flex", gap: 20, fontSize: 12, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <b style={{ display: "block" }}>{post.views}</b>
                  <span style={{ fontSize: 10, color: "#8a9899" }}>Views</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <b style={{ display: "block", color: "#168f83" }}>{post.reactions}</b>
                  <span style={{ fontSize: 10, color: "#8a9899" }}>Interactions</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
