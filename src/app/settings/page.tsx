"use client";

import AppShell from "@/components/app-shell";
import { useState } from "react";
import { Save, Key, Shield, User, Globe, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Northstar Team");
  const [timezone, setTimezone] = useState("UTC");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AppShell
      active="Settings"
      title="Workspace Settings"
      eyebrow="CONFIGURATION & ACCESS"
      description="Manage workspace preferences, team access, and platform publishing credentials."
      showBack={true}
    >
      <div style={{ maxWidth: 800, display: "grid", gap: 20 }}>
        {saved && (
          <div className="channel-notice channel-notice-success">
            <CheckCircle2 size={16} />
            <span>Workspace settings updated successfully.</span>
          </div>
        )}

        {/* General Workspace Settings */}
        <section className="panel" style={{ padding: 24 }}>
          <div className="panel-heading" style={{ marginBottom: 18 }}>
            <div>
              <h2>General Settings</h2>
              <p>Basic details for your multi-channel automation workspace</p>
            </div>
            <User size={18} color="#159c8e" />
          </div>

          <form onSubmit={handleSave} style={{ display: "grid", gap: 16 }}>
            <div>
              <label className="field-label">Workspace Name</label>
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  border: "1px solid var(--line)",
                  borderRadius: 7,
                  padding: "0 12px",
                  fontSize: 13,
                }}
              />
            </div>

            <div>
              <label className="field-label">Default Publishing Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  border: "1px solid var(--line)",
                  borderRadius: 7,
                  padding: "0 12px",
                  fontSize: 13,
                  background: "#fff",
                }}
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="Asia/Jakarta">Asia/Jakarta (WIB · UTC+7)</option>
                <option value="America/New_York">America/New York (EST/EDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>

            <button
              type="submit"
              className="primary-button"
              style={{ width: "fit-content", marginTop: 6 }}
            >
              <Save size={15} /> Save Changes
            </button>
          </form>
        </section>

        {/* Production Adapters Config Status */}
        <section className="panel" style={{ padding: 24 }}>
          <div className="panel-heading" style={{ marginBottom: 16 }}>
            <div>
              <h2>Platform API Integration Status</h2>
              <p>Configured production platform adapters</p>
            </div>
            <Key size={18} color="#159c8e" />
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              { name: "Pinterest Adapter", desc: "Pinterest API v5 · Pins & Boards publishing", status: "Active" },
              { name: "Medium Adapter", desc: "Medium API v1 · Stories & Articles publishing", status: "Active" },
              { name: "Imgbox Adapter", desc: "Direct Image Host · Direct media uploads", status: "Active" },
              { name: "Instagram Adapter", desc: "Meta Graph API v25.0 · Reels & Photos publishing", status: "Active" },
            ].map((item) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "#f7faf9",
                  border: "1px solid #e2edeb",
                }}
              >
                <div>
                  <b style={{ fontSize: 13, display: "block" }}>{item.name}</b>
                  <small style={{ color: "#778587", fontSize: 11 }}>{item.desc}</small>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#159c8e",
                    background: "#e5f7f3",
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
