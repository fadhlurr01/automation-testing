"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Wand2, Copy, Check, ArrowRight, Share2, MessageSquare, Zap, RefreshCw } from "lucide-react";

export default function AIStudioView() {
  const [topic, setTopic] = useState("Automating social media publishing with Node.js and Supabase");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [generated, setGenerated] = useState<{
    pinterest: string;
    medium: string;
    instagram: string;
    hashtags: string[];
  }>({
    pinterest: "Supercharge your multi-channel marketing with Automation Hub. Seamlessly schedule and publish across Pinterest, Medium, and Instagram from one unified workspace! #DeveloperTools #Automation",
    medium: "In today's fast-paced content landscape, managing distribution across disparate platforms often leads to fragmented analytics and duplicated effort. Here is how modern headless publishing architectures streamline the entire workflow...",
    instagram: "Level up your automation workflow! 🚀 Schedule, preview, and publish across multiple channels simultaneously with verified zero-latency delivery. #ContentCreator #AutomationHub",
    hashtags: ["#AutomationHub", "#DeveloperTools", "#MarketingAutomation", "#NextJS", "#Supabase"],
  });

  async function generateContent() {
    setLoading(true);
    // Simulate generation with AI transformer
    await new Promise((r) => setTimeout(r, 600));

    setGenerated({
      pinterest: `Discover the power of ${topic}. Effortlessly organize your publishing pipelines with unified verification! #Automation #Growth`,
      medium: `# Accelerating Content Distribution: ${topic}\n\nScaling an audience across platforms requires both consistency and platform-specific nuance. In this deep dive, we explore automated workflows and integration pipelines...`,
      instagram: `Transform your publishing strategy: ${topic} ⚡️ Clean architecture, unified analytics, and reliable multi-channel execution.`,
      hashtags: ["#Automation", "#Productivity", "#TechTrends", "#Innovation"],
    });
    setLoading(false);
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 20 }}>
      {/* Generation Prompt Control */}
      <div className="panel" style={{ padding: 22 }}>
        <div className="panel-heading" style={{ marginBottom: 16 }}>
          <div>
            <h2>AI Prompt Studio</h2>
            <p>Generate multi-platform variants in seconds</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="field-label">Topic / Content Brief</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
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
            disabled={loading}
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
      </div>
    </div>
  );
}
