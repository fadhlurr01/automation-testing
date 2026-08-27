"use client";

import {
  Activity, ArrowLeft, BarChart3, Bell, CalendarDays, ChevronDown,
  CircleHelp, LayoutDashboard, Library, Link2, Menu,
  PenLine, Plus, Rocket, Search, Settings, Sparkles, Target, X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/user-menu";
import { useState } from "react";

export type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  badge?: string;
};

export const navigationItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Campaigns", icon: Target, href: "/campaigns" },
  { label: "Publish Center", icon: Rocket, href: "/publish", badge: "Live" },
  { label: "Content Studio", icon: PenLine, href: "/content-studio" },
  { label: "Channels", icon: Link2, href: "/channels", badge: "4" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Media Library", icon: Library, href: "/media" },
  { label: "AI Studio", icon: Sparkles, href: "/ai-studio" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
];

interface AppShellProps {
  active: string;
  children: React.ReactNode;
  title?: string;
  eyebrow?: string;
  description?: string;
  actionButton?: React.ReactNode;
  showBack?: boolean;
}

export default function AppShell({
  active,
  children,
  title,
  eyebrow = "WORKSPACE COMMAND CENTER",
  description,
  actionButton,
  showBack = false,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="hub-frame">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <Link href="/dashboard" className="brand-link" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <span className="brand-mark">
              <Sparkles size={16} />
            </span>
            <span>
              Automation <b>Hub</b>
            </span>
          </Link>
          <button
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-switcher">
          <span className="workspace-avatar">N</span>
          <span>
            <b>Northstar team</b>
            <small>Workspace</small>
          </span>
          <ChevronDown size={15} />
        </div>

        <p className="nav-label">Workspace</p>
        <nav>
          {navigationItems.map(({ label, icon: IconComponent, href, badge }) => (
            <Link
              className={active.toLowerCase() === label.toLowerCase() ? "active" : ""}
              href={href}
              key={label}
              onClick={() => setMenuOpen(false)}
            >
              <IconComponent size={17} />
              <span>{label}</span>
              {badge && <i>{badge}</i>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link
            href="/settings"
            className={active.toLowerCase() === "settings" ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Settings size={17} />
            Settings
          </Link>
          <a href="#help">
            <CircleHelp size={17} />
            Help center
          </a>
          <div className="profile">
            <span className="profile-avatar">AS</span>
            <span>
              <b>Alex Smith</b>
              <small>Admin</small>
            </span>
          </div>
        </div>
      </aside>

      {/* Scrim backdrop for mobile */}
      {menuOpen && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="mobile-menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            {showBack && (
              <button
                onClick={() => router.back()}
                className="icon-button back-nav-btn"
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)" }}
                aria-label="Go back"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            )}
            <div className="breadcrumbs">
              <span>Workspace</span>
              <span>/</span>
              <b>{active}</b>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="header-quick-links" style={{ display: "flex", gap: 6 }}>
              <Link href="/dashboard" className="text-button" style={{ padding: "4px 8px", fontSize: 11 }}>Dashboard</Link>
              <Link href="/channels" className="text-button" style={{ padding: "4px 8px", fontSize: 11 }}>Channels</Link>
            </div>
            <button className="icon-button notification" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <UserMenu />
          </div>
        </header>

        <div className="page-wrap">
          {(title || actionButton) && (
            <div className="page-heading">
              <div>
                {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                <h1>{title || active}</h1>
                {description && <p className="intro">{description}</p>}
              </div>
              {actionButton ? (
                actionButton
              ) : (
                <Link className="primary-button" href="/campaigns/new">
                  <Plus size={17} />
                  Create campaign
                </Link>
              )}
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
