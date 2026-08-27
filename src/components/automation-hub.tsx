"use client";

import {
  Activity, ArrowUpRight, BarChart3, Bell, CalendarDays, ChevronDown,
  CircleHelp, FileText, ImagePlus, LayoutDashboard, Library, Link2, Menu,
  PenLine, Plus, Search, Settings, Sparkles, Target, X,
} from "lucide-react";
import Link from "next/link";
import UserMenu from "@/components/user-menu";
import { useState } from "react";

const navigation = [
  ["Dashboard", LayoutDashboard, "/"], ["Campaigns", Target, "/campaigns"],
  ["Content Studio", PenLine, "/content-studio"], ["Channels", Link2, "/channels"],
   ["Calendar", CalendarDays, "/calendar"], ["Media Library", Library, "/media"],
  ["AI Studio", Sparkles, "/ai-studio"], ["Analytics", BarChart3, "/analytics"],
] as const;
const activities = [
  ["Spring launch campaign", "Draft saved", "12 min ago", "teal"],
  ["Product walkthrough.mp4", "Added to media library", "1 hr ago", "coral"],
  ["Instagram connection", "Action required", "3 hrs ago", "amber"],
];

type Icon = typeof Activity;
function StatCard({ label, value, meta, icon: IconComponent, color }: { label: string; value: string; meta: string; icon: Icon; color: string }) {
  return <div className="stat-card"><div className="stat-topline"><span>{label}</span><span className={`stat-icon ${color}`}><IconComponent size={17} /></span></div><strong>{value}</strong><p>{meta}</p></div>;
}
function MoreDots() { return <span className="more-dots"><i /><i /><i /></span>; }

export default function AutomationHub({ active = "Dashboard" }: { active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDashboard = active === "Dashboard";
  return <div className="hub-frame">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand"><span className="brand-mark"><Sparkles size={16} /></span><span>Automation <b>Hub</b></span><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
      <div className="workspace-switcher"><span className="workspace-avatar">N</span><span><b>Northstar team</b><small>Workspace</small></span><ChevronDown size={15} /></div>
      <p className="nav-label">Workspace</p>
      <nav>{navigation.map(([label, IconComponent, href]) => <a className={active === label ? "active" : ""} href={href} key={label}><IconComponent size={17} /><span>{label}</span>{label === "Channels" && <i>3</i>}</a>)}</nav>
      <div className="sidebar-bottom"><Link href="/settings" className={active === "Settings" ? "active" : ""}><Settings size={17} />Settings</Link><a href="#help"><CircleHelp size={17} />Help center</a><div className="profile"><span className="profile-avatar">AS</span><span><b>Alex Smith</b><small>Admin</small></span><MoreDots /></div></div>
    </aside>
    {menuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><b>{active}</b></div><div className="topbar-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><UserMenu /></div></header>
      <div className="page-wrap">
        <div className="page-heading"><div><p className="eyebrow">THURSDAY, AUGUST 27, 2026</p><h1>{isDashboard ? "Good morning, Alex" : active}</h1><p className="intro">{isDashboard ? "Here is what is happening across your workspace." : `${active} is ready for your workspace.`}</p></div><Link className="primary-button" href="/campaigns/new"><Plus size={17} />Create campaign</Link></div>
        {isDashboard ? <>
          <section className="stat-grid"><StatCard label="Active campaigns" value="08" meta="+2 this month" icon={Target} color="teal" /><StatCard label="Content generated" value="142" meta="+18% from last month" icon={Sparkles} color="coral" /><StatCard label="Connected channels" value="03" meta="1 needs attention" icon={Link2} color="amber" /><StatCard label="Engagement rate" value="6.8%" meta="+0.9% from last month" icon={Activity} color="blue" /></section>
          <section className="dashboard-grid"><div className="panel activity-panel"><div className="panel-heading"><div><h2>Campaign overview</h2><p>Performance across your active campaigns</p></div><button className="text-button">View analytics <ArrowUpRight size={15} /></button></div><div className="chart-area"><div className="chart-y"><span>100k</span><span>75k</span><span>50k</span><span>25k</span><span>0</span></div><div className="chart"><div className="chart-grid-lines" /><svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-label="Campaign performance trend"><path className="chart-fill" d="M0 172 C55 170 60 132 118 150 S178 108 224 132 S284 93 338 114 S397 84 448 95 S510 42 562 72 S630 48 700 22 L700 220 L0 220Z" /><path className="chart-line" d="M0 172 C55 170 60 132 118 150 S178 108 224 132 S284 93 338 114 S397 84 448 95 S510 42 562 72 S630 48 700 22" /></svg><div className="chart-x"><span>Aug 01</span><span>Aug 08</span><span>Aug 15</span><span>Aug 22</span><span>Aug 27</span></div></div></div><div className="chart-legend"><span><i className="legend-teal" />Impressions <b>284.6k</b></span><span><i className="legend-coral" />Engagements <b>19.4k</b></span></div></div><div className="panel activity-list"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest updates from your workspace</p></div><button className="more-button" aria-label="More activity"><MoreDots /></button></div>{activities.map(([title, detail, time, tone]) => <div className="activity-item" key={title}><span className={`activity-dot ${tone}`}><FileText size={14} /></span><div><b>{title}</b><p>{detail}</p></div><time>{time}</time></div>)}<button className="view-all">View all activity <ArrowUpRight size={15} /></button></div></section>
          <section className="quick-section"><div className="panel-heading"><div><h2>Start creating</h2><p>Move your next idea from thought to published.</p></div></div><div className="quick-grid"><button className="quick-action"><span className="quick-icon violet"><Sparkles size={20} /></span><span><b>Generate content with AI</b><small>Turn a brief into platform-ready copy</small></span><ArrowUpRight size={17} /></button><button className="quick-action"><span className="quick-icon peach"><ImagePlus size={20} /></span><span><b>Upload media</b><small>Add images or video to your library</small></span><ArrowUpRight size={17} /></button><button className="quick-action"><span className="quick-icon mint"><Link2 size={20} /></span><span><b>Connect a channel</b><small>Link your publishing accounts</small></span><ArrowUpRight size={17} /></button></div></section>
        </> : <section className="empty-state panel"><span className="empty-icon"><Sparkles size={22} /></span><h2>Build your {active.toLowerCase()} workflow</h2><p>This workspace is connected to the shared Automation Hub architecture. Add your first item to get started.</p><button className="primary-button"><Plus size={17} />Create new</button></section>}
      </div>
    </main>
  </div>;
}
