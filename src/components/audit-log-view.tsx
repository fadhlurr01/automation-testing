"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  FileText,
  Sparkles,
  UploadCloud,
  Link2,
  Rocket,
  RefreshCw,
  Calendar,
  Lock,
  User,
  Settings,
} from "lucide-react";
import { AuditAction, AuditLogEntry } from "@/lib/audit/audit-logger";

const actionIcons: Record<string, typeof CheckCircle2> = {
  USER_LOGIN: User,
  MEDIA_UPLOAD: UploadCloud,
  AI_GENERATION: Sparkles,
  CONTENT_EDIT: FileText,
  CAMPAIGN_CREATION: Rocket,
  CAMPAIGN_APPROVAL: CheckCircle2,
  CHANNEL_CONNECTION: Link2,
  CHANNEL_DISCONNECTION: Link2,
  PUBLISH_REQUEST: Rocket,
  PUBLISHING_SUCCESS: CheckCircle2,
  PUBLISHING_FAILURE: AlertCircle,
  RETRY: RefreshCw,
  SCHEDULE: Calendar,
  CANCEL: AlertTriangle,
  SETTINGS_CHANGE: Settings,
};

const actionBadges: Record<string, { bg: string; text: string; label: string }> = {
  USER_LOGIN: { bg: "#eef2ff", text: "#3b5998", label: "User Login" },
  MEDIA_UPLOAD: { bg: "#fff0eb", text: "#df6c47", label: "Media Upload" },
  AI_GENERATION: { bg: "#f3e8ff", text: "#7e22ce", label: "AI Generation" },
  CONTENT_EDIT: { bg: "#eef8f5", text: "#1a8f82", label: "Content Edit" },
  CAMPAIGN_CREATION: { bg: "#e6f7f3", text: "#159c8e", label: "Campaign Created" },
  CAMPAIGN_APPROVAL: { bg: "#e6f7f3", text: "#159c8e", label: "Campaign Approved" },
  CHANNEL_CONNECTION: { bg: "#e6f7f3", text: "#159c8e", label: "Channel Connected" },
  CHANNEL_DISCONNECTION: { bg: "#fff1f0", text: "#cf1322", label: "Channel Disconnected" },
  PUBLISH_REQUEST: { bg: "#e6f4ff", text: "#1677ff", label: "Publish Request" },
  PUBLISHING_SUCCESS: { bg: "#e6f7f3", text: "#159c8e", label: "Publish Success" },
  PUBLISHING_FAILURE: { bg: "#fff1f0", text: "#cf1322", label: "Publish Failure" },
  RETRY: { bg: "#fff7e6", text: "#d48806", label: "Retry Queued" },
  SCHEDULE: { bg: "#fff7e6", text: "#d48806", label: "Scheduled" },
  CANCEL: { bg: "#fff1f0", text: "#cf1322", label: "Cancelled" },
  SETTINGS_CHANGE: { bg: "#f0f5ff", text: "#2f54eb", label: "Settings Change" },
};

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    try {
      const query = actionFilter !== "ALL" ? `?action=${actionFilter}` : "";
      const response = await fetch(`/api/audit-logs${query}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs ?? []);
      }
    } catch {
      // Continue gracefully
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  function exportCSV() {
    const headers = ["Timestamp", "Time", "Actor", "Action", "Description", "Status"];
    const rows = filteredLogs.map((l) => [
      l.createdAt || "",
      l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      l.actorName,
      l.action,
      `"${l.description.replace(/"/g, '""')}"`,
      l.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `automation_hub_audit_log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Security Privacy Notice */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 8,
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Lock size={18} color="#52c41a" />
        <div style={{ fontSize: 12, color: "#237804", lineHeight: 1.5 }}>
          <b>Security & Privacy Guarantee:</b> Passwords, OAuth access tokens, refresh tokens, client secrets, and private credentials are automatically stripped and never logged.
        </div>
      </div>

      {/* Control Bar: Filter, Search, Export */}
      <section
        className="panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div className="channel-search" style={{ minWidth: 260 }}>
          <Search size={16} />
          <input
            placeholder="Search audit trail (e.g. Arbi, Pinterest, upload)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={loadLogs}
            className="text-button"
            style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="text-button"
            style={{
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: "1px solid var(--line)",
              padding: "6px 12px",
              borderRadius: 6,
            }}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </section>

      {/* Filter Categories Chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#697b7c", marginRight: 4 }}>Filter Activity:</span>
        {[
          { id: "ALL", label: "All Activities" },
          { id: "PUBLISHING_SUCCESS", label: "Publish Success" },
          { id: "PUBLISHING_FAILURE", label: "Publish Failure" },
          { id: "RETRY", label: "Retry" },
          { id: "MEDIA_UPLOAD", label: "Media Uploads" },
          { id: "AI_GENERATION", label: "AI Generations" },
          { id: "CAMPAIGN_APPROVAL", label: "Campaigns" },
          { id: "CHANNEL_CONNECTION", label: "Channels" },
          { id: "USER_LOGIN", label: "Logins" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActionFilter(f.id)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              border: actionFilter === f.id ? "none" : "1px solid var(--line)",
              background: actionFilter === f.id ? "var(--navy)" : "#fff",
              color: actionFilter === f.id ? "#fff" : "#697b7c",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Audit Log Timeline */}
      <section className="panel" style={{ padding: 22 }}>
        <div className="panel-heading" style={{ marginBottom: 18 }}>
          <div>
            <h2>Workspace Audit Trail</h2>
            <p>Chronological record of user actions and automated publishing events</p>
          </div>
          <span style={{ fontSize: 12, color: "#8a9899" }}>{filteredLogs.length} events logged</span>
        </div>

        {filteredLogs.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredLogs.map((log, index) => {
              const badge = actionBadges[log.action] || { bg: "#f3f5f5", text: "#697b7c", label: log.action };
              const IconComp = actionIcons[log.action] || Clock;
              const dateObj = log.createdAt ? new Date(log.createdAt) : new Date();
              const timeString = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const dateString = dateObj.toLocaleDateString([], { month: "short", day: "numeric" });

              return (
                <div
                  key={log.id || `log_${index}`}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: log.status === "FAILURE" ? "#fff9f9" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    transition: "border 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260 }}>
                    {/* Timestamp Pill */}
                    <div style={{ textAlign: "center", minWidth: 50 }}>
                      <b style={{ fontSize: 13, color: "var(--navy)", display: "block" }}>{timeString}</b>
                      <small style={{ fontSize: 10, color: "#8a9899" }}>{dateString}</small>
                    </div>

                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: badge.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: badge.text,
                        flexShrink: 0,
                      }}
                    >
                      <IconComp size={16} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: badge.bg,
                            color: badge.text,
                          }}
                        >
                          {badge.label}
                        </span>
                        <span style={{ fontSize: 11, color: "#8a9899" }}>Actor: <b>{log.actorName}</b></span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
                        {log.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: 4,
                        background:
                          log.status === "SUCCESS"
                            ? "#e6f7f3"
                            : log.status === "FAILURE"
                            ? "#fff1f0"
                            : log.status === "WARNING"
                            ? "#fff7e6"
                            : "#e6f4ff",
                        color:
                          log.status === "SUCCESS"
                            ? "#159c8e"
                            : log.status === "FAILURE"
                            ? "#cf1322"
                            : log.status === "WARNING"
                            ? "#d48806"
                            : "#1677ff",
                      }}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#8a9899" }}>
            <Clock size={30} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
            <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>No audit entries match filter</h3>
            <p style={{ margin: 0, fontSize: 12 }}>All recorded workspace activities will appear in this timeline.</p>
          </div>
        )}
      </section>
    </div>
  );
}
