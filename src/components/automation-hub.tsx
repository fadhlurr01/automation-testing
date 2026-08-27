"use client";

import {
  Activity, ArrowUpRight, BarChart3, Bell, CalendarDays, ChevronDown,
  CircleHelp, FileText, ImagePlus, LayoutDashboard, Library, Link2, Menu,
  PenLine, Plus, Rocket, Search, Settings, Sparkles, Target, X,
} from "lucide-react";
import Link from "next/link";
import UserMenu from "@/components/user-menu";
import { useEffect, useState } from "react";

const navigation = [
  ["Dashboard", LayoutDashboard, "/dashboard"],
  ["Campaigns", Target, "/campaigns"],
  ["Publish Center", Rocket, "/publish"],
  ["Content Studio", PenLine, "/content-studio"],
  ["Channels", Link2, "/channels"],
  ["Calendar", CalendarDays, "/calendar"],
  ["Media Library", Library, "/media"],
  ["AI Studio", Sparkles, "/ai-studio"],
  ["Analytics", BarChart3, "/analytics"],
] as const;

type Icon = typeof Activity;

function StatCard({ label, value, meta, icon: IconComponent, color }: { label: string; value: string; meta: string; icon: Icon; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-topline">
        <span>{label}</span>
        <span className={`stat-icon ${color}`}>
          <IconComponent size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{meta}</p>
    </div>
  );
}

function MoreDots() {
  return (
    <span className="more-dots">
      <i />
      <i />
      <i />
    </span>
  );
}

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: string;
}

export default function AutomationHub({ active = "Dashboard" }: { active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    campaigns: 0,
    content: 0,
    channels: 0,
    media: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const isDashboard = active === "Dashboard";

  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        const [campRes, contRes, chanRes, medRes] = await Promise.all([
          fetch("/api/campaigns"),
          fetch("/api/content"),
          fetch("/api/channels"),
          fetch("/api/media"),
        ]);

        let campCount = 0;
        let contCount = 0;
        let chanCount = 0;
        let medCount = 0;
        const realActs: ActivityItem[] = [];

        if (campRes.ok) {
          const d = await campRes.json();
          const camps = d.campaigns ?? [];
          campCount = camps.length;
          for (const c of camps.slice(0, 3)) {
            realActs.push({
              id: c.id,
              title: c.name,
              detail: `Campaign status: ${c.status || "draft"}`,
              time: new Date(c.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              tone: "teal",
            });
          }
        }

        if (contRes.ok) {
          const d = await contRes.json();
          const contents = d.content ?? [];
          contCount = contents.length;
          for (const item of contents.slice(0, 2)) {
            realActs.push({
              id: item.id,
              title: item.title || "Content draft",
              detail: "Saved in Content Studio",
              time: new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              tone: "coral",
            });
          }
        }

        if (chanRes.ok) {
          const d = await chanRes.json();
          const chs = d.channels ?? [];
          chanCount = chs.filter((c: { status: string }) => c.status === "connected").length;
        }

        if (medRes.ok) {
          const d = await medRes.json();
          medCount = (d.assets ?? []).length;
        }

        setStats({
          campaigns: campCount,
          content: contCount,
          channels: chanCount,
          media: medCount,
        });

        setActivities(realActs);
      } catch {
        // Silently continue
      }
    }
    loadWorkspaceData();
  }, []);

  return (
    <div className="hub-frame">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <span className="brand-mark">
              <Sparkles size={16} />
            </span>
            <span>
              Automation <b>Hub</b>
            </span>
          </Link>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
            <X size={19} />
          </button>
        </div>

        <div className="workspace-switcher">
          <span className="workspace-avatar">N</span>
          <span>
            <b>Workspace</b>
            <small>Production Environment</small>
          </span>
          <ChevronDown size={15} />
        </div>

        <p className="nav-label">Workspace</p>
        <nav>
          {navigation.map(([label, IconComponent, href]) => (
            <Link
              className={active.toLowerCase() === label.toLowerCase() ? "active" : ""}
              href={href}
              key={label}
              onClick={() => setMenuOpen(false)}
            >
              <IconComponent size={17} />
              <span>{label}</span>
              {label === "Channels" && <i>4</i>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link href="/settings" className={active === "Settings" ? "active" : ""} onClick={() => setMenuOpen(false)}>
            <Settings size={17} />
            Settings
          </Link>
          <a href="#help">
            <CircleHelp size={17} />
            Help center
          </a>
          <div className="profile">
            <span className="profile-avatar">U</span>
            <span>
              <b>Your Account</b>
              <small>Workspace Owner</small>
            </span>
            <MoreDots />
          </div>
        </div>
      </aside>

      {menuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <b>{active}</b>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="icon-button notification" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <UserMenu />
          </div>
        </header>

        <div className="page-wrap">
          <div className="page-heading">
            <div>
              <p className="eyebrow">AUTOMATION HUB WORKSPACE</p>
              <h1>{isDashboard ? "Workspace Overview" : active}</h1>
              <p className="intro">
                {isDashboard
                  ? "Here is what is happening across your multi-channel distribution pipeline."
                  : `${active} is ready for your content workflow.`}
              </p>
            </div>
            <Link className="primary-button" href="/campaigns/new">
              <Plus size={17} />
              Create campaign
            </Link>
          </div>

          {isDashboard ? (
            <>
              <section className="stat-grid">
                <StatCard
                  label="Active campaigns"
                  value={String(stats.campaigns).padStart(2, "0")}
                  meta={stats.campaigns > 0 ? "Configured campaigns" : "No campaigns created yet"}
                  icon={Target}
                  color="teal"
                />
                <StatCard
                  label="Content generated"
                  value={String(stats.content).padStart(2, "0")}
                  meta={stats.content > 0 ? "Saved creative drafts" : "Create draft in Content Studio"}
                  icon={Sparkles}
                  color="coral"
                />
                <StatCard
                  label="Connected channels"
                  value={String(stats.channels).padStart(2, "0")}
                  meta={stats.channels > 0 ? "Active connections" : "Connect Pinterest, Medium, etc."}
                  icon={Link2}
                  color="amber"
                />
                <StatCard
                  label="Media assets"
                  value={String(stats.media).padStart(2, "0")}
                  meta={stats.media > 0 ? "Photos & videos uploaded" : "Upload media to library"}
                  icon={ImagePlus}
                  color="blue"
                />
              </section>

              <section className="dashboard-grid">
                <div className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Publishing Distribution</h2>
                      <p>Active multi-platform automation support</p>
                    </div>
                    <Link href="/channels" className="text-button">
                      Manage Channels <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  <div style={{ padding: "30px 10px", textAlign: "center" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginTop: 10 }}>
                      {[
                        { name: "Pinterest", type: "Pins & Boards", color: "#df6c47", bg: "#fff0eb" },
                        { name: "Medium", type: "Articles & Stories", color: "#1a8f82", bg: "#eef8f5" },
                        { name: "Imgbox", type: "Direct Image Host", color: "#3d70b8", bg: "#edf3fc" },
                        { name: "Instagram", type: "Reels & Photos", color: "#b03a7a", bg: "#fcedf5" },
                      ].map((p) => (
                        <div key={p.name} style={{ padding: 14, borderRadius: 8, background: p.bg, textAlign: "left" }}>
                          <b style={{ color: p.color, fontSize: 13, display: "block" }}>{p.name}</b>
                          <small style={{ color: "#697b7c", fontSize: 10 }}>{p.type}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="panel activity-list">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent workspace items</h2>
                      <p>Latest drafts and campaigns created</p>
                    </div>
                    <button className="more-button" aria-label="More activity">
                      <MoreDots />
                    </button>
                  </div>

                  {activities.length > 0 ? (
                    activities.map((item) => (
                      <div className="activity-item" key={item.id}>
                        <span className={`activity-dot ${item.tone}`}>
                          <FileText size={14} />
                        </span>
                        <div>
                          <b>{item.title}</b>
                          <p>{item.detail}</p>
                        </div>
                        <time>{item.time}</time>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 10px", color: "#8a9899" }}>
                      <p style={{ fontSize: 12, margin: 0 }}>No items created yet in this workspace.</p>
                      <small style={{ display: "block", marginTop: 4 }}>
                        Create a campaign or draft content to see live updates.
                      </small>
                    </div>
                  )}

                  <Link href="/campaigns" className="view-all">
                    View all campaigns <ArrowUpRight size={15} />
                  </Link>
                </div>
              </section>

              <section className="quick-section">
                <div className="panel-heading">
                  <div>
                    <h2>Start creating</h2>
                    <p>Move your next idea from thought to published across all platforms.</p>
                  </div>
                </div>
                <div className="quick-grid">
                  <Link href="/ai-studio" className="quick-action" style={{ textDecoration: "none" }}>
                    <span className="quick-icon violet">
                      <Sparkles size={20} />
                    </span>
                    <span>
                      <b>Generate with AI Studio</b>
                      <small>Turn a custom brief into platform-ready copy</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </Link>
                  <Link href="/media" className="quick-action" style={{ textDecoration: "none" }}>
                    <span className="quick-icon peach">
                      <ImagePlus size={20} />
                    </span>
                    <span>
                      <b>Upload media</b>
                      <small>Add images or video to your private library</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </Link>
                  <Link href="/channels" className="quick-action" style={{ textDecoration: "none" }}>
                    <span className="quick-icon mint">
                      <Link2 size={20} />
                    </span>
                    <span>
                      <b>Connect a channel</b>
                      <small>Link Pinterest, Medium, Imgbox, or IG</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
              </section>
            </>
          ) : (
            <section className="empty-state panel">
              <span className="empty-icon">
                <Sparkles size={22} />
              </span>
              <h2>{active} Workspace</h2>
              <p>This section is connected to the shared Automation Hub architecture. Create your first item to begin.</p>
              <Link href="/campaigns/new" className="primary-button">
                <Plus size={17} />
                Create new
              </Link>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
