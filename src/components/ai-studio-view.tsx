"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wand2,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Globe2,
  Share2,
  Rocket,
  PenLine,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import type { AiAnalysis, SupportedLanguage } from "@/lib/ai/provider";

export default function AIStudioView() {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("id");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [generated, setGenerated] = useState<AiAnalysis | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) {
      setNotice(language === "id" ? "Masukkan topik atau deskripsi konten terlebih dahulu." : "Please enter a topic or content brief first.");
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          language,
          suppliedContext: `Tone: ${tone}. Create high-impact, marketing copy for multi-platform distribution.`,
        }),
      });

      const result = await response.json();
      if (response.ok && result.analysis) {
        setGenerated(result.analysis);
        setNotice(
          language === "id"
            ? "✨ Konten berhasil digenerate dalam Bahasa Indonesia!"
            : "✨ Content successfully generated in English!"
        );
      } else {
        setNotice(result.error || "Gagal membuat konten AI.");
      }
    } catch {
      setNotice("Terjadi kesalahan jaringan saat memanggil generator AI.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Notice Banner */}
      {notice && (
        <div
          style={{
            background: "#e6f8f5",
            border: "1px solid #78c9be",
            padding: "12px 18px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#168f83",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Sparkles size={16} />
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#168f83" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Configuration & Prompt Studio */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Left Column: Input Controls */}
        <div className="panel" style={{ padding: 24, display: "grid", gap: 16 }}>
          <div className="panel-heading" style={{ margin: 0 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>
                AI Copy & Variant Studio
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#697b7c" }}>
                Generate multi-platform copy tailored in Bahasa Indonesia or English.
              </p>
            </div>
          </div>

          {/* Language Selector (Bahasa Indonesia vs English) */}
          <div>
            <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Globe2 size={14} color="#168f83" />
              PILIHAN BAHASA / LANGUAGE
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setLanguage("id")}
                className={language === "id" ? "primary-button" : "text-button"}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  justifyContent: "center",
                  border: language === "id" ? "none" : "1px solid var(--line)",
                  background: language === "id" ? "#168f83" : "#fff",
                  color: language === "id" ? "#fff" : "#2d3748",
                  boxShadow: language === "id" ? "0 4px 12px rgba(22,143,131,0.25)" : "none",
                }}
              >
                🇮🇩 Bahasa Indonesia
              </button>

              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={language === "en" ? "primary-button" : "text-button"}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  justifyContent: "center",
                  border: language === "en" ? "none" : "1px solid var(--line)",
                  background: language === "en" ? "#168f83" : "#fff",
                  color: language === "en" ? "#fff" : "#2d3748",
                  boxShadow: language === "en" ? "0 4px 12px rgba(22,143,131,0.25)" : "none",
                }}
              >
                🇬🇧 English (US / Global)
              </button>
            </div>
          </div>

          {/* Topic Brief */}
          <div>
            <label className="field-label">
              {language === "id" ? "TOPIK / BRIEF KONTEN PROMOSI" : "TOPIC / PROMOTIONAL BRIEF"}
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                language === "id"
                  ? "Contoh: Peluncuran workshop otomatisasi multi-platform 2026, fitur unggulan jadwal otomatis dan 37 channel aktif..."
                  : "Example: Launching Multi-Platform Automation Summit 2026, key features include automated scheduling and 37 connected channels..."
              }
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontSize: 13,
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Tone Selector */}
          <div>
            <label className="field-label">
              {language === "id" ? "GAYA BAHASA / TONE" : "TONE OF VOICE"}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[
                { label: language === "id" ? "Profesional" : "Professional", value: "Professional" },
                { label: language === "id" ? "Menarik" : "Engaging", value: "Engaging" },
                { label: language === "id" ? "Informatif" : "Informative", value: "Technical" },
                { label: language === "id" ? "Kasual" : "Casual", value: "Casual" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={tone === t.value ? "primary-button" : "text-button"}
                  style={{
                    padding: "8px 6px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    justifyContent: "center",
                    border: tone === t.value ? "none" : "1px solid var(--line)",
                    background: tone === t.value ? "var(--navy)" : "#fff",
                    color: tone === t.value ? "#fff" : "#697b7c",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="primary-button"
              style={{ flex: 1, padding: "12px 20px", fontSize: 13, justifyContent: "center" }}
            >
              {loading ? <RefreshCw className="spin" size={16} /> : <Wand2 size={16} />}
              {loading
                ? language === "id" ? "Menghasilkan Konten..." : "Generating Copy..."
                : language === "id" ? "🚀 Buat Konten AI Sekarang" : "🚀 Generate AI Copy Now"}
            </button>
          </div>

          {/* Link to Poster AI Studio */}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#697b7c" }}>
              {language === "id" ? "Punya poster atau gambar flyer?" : "Have a poster or visual creative?"}
            </span>
            <Link
              href="/content-studio"
              style={{ fontSize: 12, fontWeight: 700, color: "#168f83", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <ImageIcon size={13} /> {language === "id" ? "Buka Studio Poster ↗" : "Open Poster Studio ↗"}
            </Link>
          </div>
        </div>

        {/* Right Column: Master Generated Draft */}
        <div className="panel" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>
                  {language === "id" ? "Draf Konten Utama" : "Master Generated Draft"}
                </h3>
                <span style={{ fontSize: 11, color: "#8a9899" }}>
                  {language === "id" ? "Terstruktur untuk 37 platform aktif" : "Structured for 37 active platforms"}
                </span>
              </div>

              {generated && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#168f83", background: "#e6f7f3", padding: "3px 8px", borderRadius: 4 }}>
                  {generated.language.toUpperCase()}
                </span>
              )}
            </div>

            {generated ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    {language === "id" ? "Judul Utama" : "Master Title"}
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{generated.title}</p>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    {language === "id" ? "Deskripsi / Ringkasan" : "Description"}
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{generated.description}</p>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    {language === "id" ? "Hashtag & Kata Kunci" : "Hashtags & Keywords"}
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#168f83", fontWeight: 600 }}>
                    {generated.hashtags.join(" ")}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#8a9899" }}>
                <Sparkles size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                  {language === "id" ? "Hasil AI akan muncul di sini" : "AI generated results will appear here"}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11 }}>
                  {language === "id" ? "Ketik topik di sebelah kiri dan klik Buat Konten AI" : "Enter a brief on the left and click Generate"}
                </p>
              </div>
            )}
          </div>

          {generated && (
            <div style={{ display: "flex", gap: 10, marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <Link
                href="/campaigns/new"
                className="primary-button"
                style={{ flex: 1, padding: "10px 14px", fontSize: 12, justifyContent: "center" }}
              >
                <Rocket size={14} /> {language === "id" ? "Buat Kampanye Sekarang ↗" : "Create Campaign ↗"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Platform-Specific Variants Breakdown */}
      {generated?.platformVariants && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--navy)" }}>
                {language === "id" ? "Varian Otomatis per Platform" : "Platform-Specific Variants"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#697b7c" }}>
                {language === "id"
                  ? "Format konten telah dioptimasi khusus untuk tiap karakteristik platform."
                  : "Copy formatted and optimized for each specific platform algorithm."}
              </p>
            </div>
            <Link href="/publish" className="text-button" style={{ fontSize: 12, color: "#168f83" }}>
              {language === "id" ? "Buka Publish Center ↗" : "Open Publish Center ↗"}
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {/* Instagram */}
            <div className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#b03a7a" }}>📸 Instagram</span>
                  <button
                    onClick={() => handleCopy("ig", generated.platformVariants?.instagram || "")}
                    className="text-button"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    {copiedKey === "ig" ? <Check size={12} color="#168f83" /> : <Copy size={12} />}
                    {copiedKey === "ig" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#334155", whiteSpace: "pre-line", lineHeight: 1.4 }}>
                  {generated.platformVariants.instagram}
                </p>
              </div>
            </div>

            {/* Pinterest */}
            <div className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#df6c47" }}>📌 Pinterest</span>
                  <button
                    onClick={() => handleCopy("pin", generated.platformVariants?.pinterest || "")}
                    className="text-button"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    {copiedKey === "pin" ? <Check size={12} color="#168f83" /> : <Copy size={12} />}
                    {copiedKey === "pin" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                  {generated.platformVariants.pinterest}
                </p>
              </div>
            </div>

            {/* Medium */}
            <div className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a8f82" }}>📝 Medium (Markdown)</span>
                  <button
                    onClick={() => handleCopy("med", generated.platformVariants?.medium || "")}
                    className="text-button"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    {copiedKey === "med" ? <Check size={12} color="#168f83" /> : <Copy size={12} />}
                    {copiedKey === "med" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre style={{ margin: 0, fontSize: 11, color: "#334155", whiteSpace: "pre-wrap", maxHeight: 120, overflowY: "auto", fontFamily: "inherit" }}>
                  {generated.platformVariants.medium}
                </pre>
              </div>
            </div>

            {/* X / Twitter */}
            <div className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1da1f2" }}>🐦 X / Twitter</span>
                  <button
                    onClick={() => handleCopy("tw", generated.platformVariants?.twitter || "")}
                    className="text-button"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    {copiedKey === "tw" ? <Check size={12} color="#168f83" /> : <Copy size={12} />}
                    {copiedKey === "tw" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                  {generated.platformVariants.twitter}
                </p>
              </div>
            </div>

            {/* Facebook */}
            <div className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#3b5998" }}>📘 Facebook</span>
                  <button
                    onClick={() => handleCopy("fb", generated.platformVariants?.facebook || "")}
                    className="text-button"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    {copiedKey === "fb" ? <Check size={12} color="#168f83" /> : <Copy size={12} />}
                    {copiedKey === "fb" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                  {generated.platformVariants.facebook}
                </p>
              </div>
            </div>

            {/* ImgBB */}
            <div className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#3d70b8" }}>🖼️ ImgBB / Image Host</span>
                  <button
                    onClick={() => handleCopy("imgbb", generated.platformVariants?.imgbb || "")}
                    className="text-button"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    {copiedKey === "imgbb" ? <Check size={12} color="#168f83" /> : <Copy size={12} />}
                    {copiedKey === "imgbb" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                  {generated.platformVariants.imgbb}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
