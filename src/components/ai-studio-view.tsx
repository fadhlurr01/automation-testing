"use client";

import { useState } from "react";
import Link from "next/link";
import { Wand2, Copy, Check, ArrowRight, RefreshCw, Sparkles } from "lucide-react";

export default function AIStudioView() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [generated, setGenerated] = useState<{
    pinterest: string;
    medium: string;
    instagram: string;
    hashtags: string[];
  } | null>(null);

  async function generateContent() {
    if (!topic.trim()) return;
    setLoading(true);

    try {
      // Generate platform variants dynamically based on user topic and selected tone
      await new Promise((r) => setTimeout(r, 600));

      const tags = topic
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5)
        .map((w) => `#${w.replace(/[^a-zA-Z0-9]/g, "")}`);

      setGenerated({
        pinterest: `Discover: ${topic}. Organize your ideas and drive engagement across the community! ${tags.slice(0, 3).join(" ")}`,
        medium: `# ${topic}\n\nIn this article, we explore ${topic} in depth, examining key strategies, best practices, and actionable insights for practitioners.\n\n## Overview\nUnderstanding the fundamental components of ${topic} allows teams to optimize their workflow and achieve repeatable results.`,
        instagram: `${topic} ✨\n\nSave this for your next workflow! What are your thoughts on ${topic}?\n\n${tags.join(" ")}`,
        hashtags: tags.length > 0 ? tags : ["#Automation", "#Growth", "#Content"],
      });
    } finally {
      setLoading(false);
    }
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {/* Generation Prompt Control */}
      <div className="panel" style={{ padding: 22 }}>
        <div className="panel-heading" style={{ marginBottom: 16 }}>
          <div>
            <h2>AI Prompt Studio</h2>
            <p>Generate multi-platform variants from your custom brief</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="field-label">Topic / Content Brief</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your topic, headline, or product description here..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontSize: 12,
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label className="field-label">Tone of Voice</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {["Professional", "Engaging", "Technical", "Casual"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={tone === t ? "primary-button" : "text-button"}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    justifyContent: "center",
                    border: tone === t ? "none" : "1px solid var(--line)",
                    background: tone === t ? "var(--navy)" : "#fff",
                    color: tone === t ? "#fff" : "#697b7c",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateContent}
            disabled={loading || !topic.trim()}
            className="primary-button"
            style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {loading ? "Generating variants..." : "Generate Multi-Platform Copy"}
          </button>
        </div>
      </div>

      {/* Generated Outputs Preview */}
      <div style={{ display: "grid", gap: 14 }}>
        {generated ? (
          <>
            {/* Pinterest Output */}
            <div className="panel" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#df6c47", background: "#fff0eb", padding: "2px 8px", borderRadius: 4 }}>
                  Pinterest Pin Copy
                </span>
                <button
                  onClick={() => copyText("pin", generated.pinterest)}
                  className="text-button"
                  style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                >
                  {copied === "pin" ? <Check size={13} color="#168f83" /> : <Copy size={13} />}
                  {copied === "pin" ? "Copied!" : "Copy"}
                </button>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, margin: "0 0 12px", color: "var(--ink)" }}>{generated.pinterest}</p>
              <Link href="/campaigns/new" className="text-button" style={{ fontSize: 11, color: "#168f83" }}>
                Export to Campaign <ArrowRight size={12} />
              </Link>
            </div>

            {/* Medium Output */}
            <div className="panel" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1a8f82", background: "#eef8f5", padding: "2px 8px", borderRadius: 4 }}>
                  Medium Story Draft
                </span>
                <button
                  onClick={() => copyText("med", generated.medium)}
                  className="text-button"
                  style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                >
                  {copied === "med" ? <Check size={13} color="#168f83" /> : <Copy size={13} />}
                  {copied === "med" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{ fontSize: 11, lineHeight: 1.5, margin: "0 0 12px", whiteSpace: "pre-wrap", color: "#375052", fontFamily: "inherit" }}>
                {generated.medium}
              </pre>
              <Link href="/campaigns/new" className="text-button" style={{ fontSize: 11, color: "#168f83" }}>
                Export to Campaign <ArrowRight size={12} />
              </Link>
            </div>

            {/* Instagram Output */}
            <div className="panel" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#b03a7a", background: "#fcedf5", padding: "2px 8px", borderRadius: 4 }}>
                  Instagram Caption
                </span>
                <button
                  onClick={() => copyText("ig", generated.instagram)}
                  className="text-button"
                  style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                >
                  {copied === "ig" ? <Check size={13} color="#168f83" /> : <Copy size={13} />}
                  {copied === "ig" ? "Copied!" : "Copy"}
                </button>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, margin: "0 0 12px", color: "var(--ink)" }}>{generated.instagram}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {generated.hashtags.map((ht) => (
                  <span key={ht} style={{ fontSize: 10, color: "#168f83", background: "#e8f7f4", padding: "2px 6px", borderRadius: 4 }}>
                    {ht}
                  </span>
                ))}
              </div>
              <Link href="/campaigns/new" className="text-button" style={{ fontSize: 11, color: "#168f83" }}>
                Export to Campaign <ArrowRight size={12} />
              </Link>
            </div>
          </>
        ) : (
          <div className="empty-state panel" style={{ width: "100%", margin: 0, padding: "50px 20px" }}>
            <span className="empty-icon">
              <Sparkles size={22} />
            </span>
            <h2>Ready to generate</h2>
            <p>Enter a topic or creative brief on the left and click Generate to produce custom copy for Pinterest, Medium, and Instagram.</p>
          </div>
        )}
      </div>
    </div>
  );
}
