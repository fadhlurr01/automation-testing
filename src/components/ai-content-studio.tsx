"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  WandSparkles,
  UploadCloud,
  Globe2,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SupportedLanguage } from "@/lib/ai/provider";

type Asset = { id: string; file_name: string; mime_type: string; signedUrl: string | null };
type Analysis = {
  language?: SupportedLanguage;
  topic: string;
  facts: Record<string, string | string[]>;
  title: string;
  description: string;
  caption: string;
  keywords: string[];
  hashtags: string[];
  cta: string;
  seo_title: string;
  seo_description: string;
  alt_text: string;
};

const blank: Analysis = {
  language: "id",
  topic: "",
  facts: {},
  title: "",
  description: "",
  caption: "",
  keywords: [],
  hashtags: [],
  cta: "",
  seo_title: "",
  seo_description: "",
  alt_text: "",
};

export default function AIContentStudio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("id");
  const [analysis, setAnalysis] = useState<Analysis>(blank);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [savedContentId, setSavedContentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function loadAssets() {
    try {
      const response = await fetch("/api/media");
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch {
      // Continue
    }
  }

  useEffect(() => {
    loadAssets();
  }, []);

  const selected = assets.find((asset) => asset.id === assetId);

  function update(key: keyof Analysis, value: string) {
    setAnalysis((current) => ({
      ...current,
      [key]: key === "keywords" || key === "hashtags" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value,
    }));
  }

  async function generate(instruction?: string) {
    if (!assetId && !analysis.topic.trim()) {
      setStatus(language === "id" ? "Pilih poster atau masukkan topik terlebih dahulu." : "Select a poster or enter a topic first.");
      return;
    }

    setBusy(true);
    setStatus(language === "id" ? "Menganalisis poster dan mengekstrak teks visual..." : "Analyzing poster and generating factual copy...");

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaAssetId: assetId || undefined,
          topic: analysis.topic || undefined,
          suppliedContext: instruction,
          language,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setAnalysis(result.analysis);
      setStatus(
        language === "id"
          ? "✨ Draf AI selesai digenerate dalam Bahasa Indonesia. Silakan periksa rincian di bawah."
          : "✨ AI draft generated in English. Please review and refine the fields below."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!analysis.title.trim()) {
      setStatus(language === "id" ? "Isi judul konten sebelum menyimpan." : "Please add a title before saving.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaAssetId: assetId || null, analysis }),
      });

      const result = await response.json();
      if (response.ok && result.content) {
        setSavedContentId(result.content.id);
        setStatus(
          language === "id"
            ? "✅ Draf konten berhasil disimpan! Anda dapat langsung membuat kampanye distribusi."
            : "✅ Content draft saved! Ready for campaign distribution."
        );
      } else {
        setStatus(result.error || "Gagal menyimpan draf.");
      }
    } catch {
      setStatus("Gagal menyimpan ke database.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDirectUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setStatus(`Mengunggah ${file.name}...`);

    try {
      const form = new FormData();
      form.append("file", file);

      // Create a temporary mock asset in UI immediately for testing
      const fakeUrl = URL.createObjectURL(file);
      const newAsset: Asset = {
        id: "asset_" + Date.now(),
        file_name: file.name,
        mime_type: file.type,
        signedUrl: fakeUrl,
      };

      setAssets((prev) => [newAsset, ...prev]);
      setAssetId(newAsset.id);
      setStatus(`${file.name} berhasil diunggah.`);
    } catch {
      setStatus("Gagal mengunggah gambar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="studio-page">
      <header className="studio-heading">
        <div>
          <Link
            href="/dashboard"
            className="back-link"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#168f83", textDecoration: "none", marginBottom: 8, fontWeight: 600 }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <p className="eyebrow">AI CONTENT & POSTER STUDIO</p>
          <h1>{language === "id" ? "Ubah Poster Menjadi Draf Kampanye" : "Turn Posters into Campaign Drafts"}</h1>
          <p className="intro">
            {language === "id"
              ? "Ekstrak teks poster visual dan generate draf promosi siap rilis ke 37 channel."
              : "Analyze poster visuals and generate platform-optimized promotional copy."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Language Toggle in Header */}
          <div style={{ display: "flex", background: "#f0f4f4", borderRadius: 6, padding: 3 }}>
            <button
              type="button"
              onClick={() => { setLanguage("id"); if (analysis.title) generate(); }}
              style={{
                border: "none",
                padding: "5px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                background: language === "id" ? "#168f83" : "transparent",
                color: language === "id" ? "#fff" : "#697b7c",
              }}
            >
              🇮🇩 ID
            </button>
            <button
              type="button"
              onClick={() => { setLanguage("en"); if (analysis.title) generate(); }}
              style={{
                border: "none",
                padding: "5px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                background: language === "en" ? "#168f83" : "transparent",
                color: language === "en" ? "#fff" : "#697b7c",
              }}
            >
              🇬🇧 EN
            </button>
          </div>

          <button className="primary-button" onClick={save} disabled={busy}>
            <Save size={16} />
            {language === "id" ? "Simpan Draf" : "Save Draft"}
          </button>
        </div>
      </header>

      {status && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: status.startsWith("✅") || status.startsWith("✨") ? "#e6f8f5" : "#fef3c7",
            color: status.startsWith("✅") || status.startsWith("✨") ? "#168f83" : "#92400e",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{status}</span>
          {savedContentId && (
            <Link
              href="/campaigns/new"
              style={{
                color: "#168f83",
                fontWeight: 700,
                textDecoration: "underline",
                fontSize: 12,
              }}
            >
              {language === "id" ? "Lanjut ke Campaign Builder ↗" : "Proceed to Campaign Builder ↗"}
            </Link>
          )}
        </div>
      )}

      <div className="studio-layout">
        {/* Left Column: Source Media & Upload */}
        <section className="studio-preview panel">
          <div className="studio-section-title">
            <div>
              <h2>{language === "id" ? "Media Sumber (Poster/Flyer)" : "Source Media"}</h2>
              <p>{language === "id" ? "Pilih dari Media Library atau unggah langsung." : "Choose from library or upload fresh asset."}</p>
            </div>
            <ImageIcon size={18} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="studio-select"
              value={assetId}
              onChange={(event) => {
                setAssetId(event.target.value);
                setStatus("");
              }}
              style={{ flex: 1 }}
            >
              <option value="">{language === "id" ? "Pilih poster dari library..." : "Select a poster..."}</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.file_name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-button"
              style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, border: "1px solid var(--line)", whiteSpace: "nowrap" }}
            >
              <UploadCloud size={14} /> {language === "id" ? "Unggah" : "Upload"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleDirectUpload}
            />
          </div>

          <div className="poster-canvas">
            {selected?.signedUrl ? (
              <Image src={selected.signedUrl} alt={selected.file_name} fill sizes="(max-width: 900px) 100vw, 42vw" unoptimized />
            ) : (
              <div>
                <ImageIcon size={32} />
                <span>{language === "id" ? "Pratinjau poster muncul di sini" : "Your poster preview appears here"}</span>
              </div>
            )}
          </div>

          <button className="analyze-button" onClick={() => generate()} disabled={busy || (!assetId && !analysis.topic)}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
            {language === "id" ? "⚡ Generate Konten AI (Bilingual)" : "⚡ Analyze & Generate with AI"}
          </button>

          {selected && (
            <p className="source-meta">
              {selected.file_name} · {selected.mime_type}
            </p>
          )}
        </section>

        {/* Right Column: Review & Field Editor */}
        <section className="studio-editor panel">
          <div className="studio-section-title">
            <div>
              <h2>{language === "id" ? "Tinjau & Edit Muatan Konten" : "Review & Edit Content"}</h2>
              <p>{language === "id" ? "Sesuaikan judul, caption, hashtag, dan CTA sebelum dipublikasikan." : "Refine copy and facts before creating campaign."}</p>
            </div>
            <WandSparkles size={18} />
          </div>

          <div className="studio-fields">
            <label>
              <span className="field-label">{language === "id" ? "JUDUL KONTEN / TITLE" : "CONTENT TITLE"}</span>
              <input
                value={analysis.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder={language === "id" ? "Judul kampanye yang menarik..." : "Compelling campaign headline..."}
              />
            </label>

            <label>
              <span className="field-label">{language === "id" ? "DESKRIPSI LENGKAP" : "DESCRIPTION"}</span>
              <textarea
                value={analysis.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder={language === "id" ? "Deskripsi detail isi konten..." : "Comprehensive description of content..."}
                rows={3}
              />
            </label>

            <label>
              <span className="field-label">{language === "id" ? "CAPTION MEDIA SOSIAL" : "SOCIAL MEDIA CAPTION"}</span>
              <textarea
                value={analysis.caption}
                onChange={(e) => update("caption", e.target.value)}
                placeholder={language === "id" ? "Caption siap unggah ke Instagram / Facebook / Twitter..." : "Platform-ready social media caption..."}
                rows={3}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span className="field-label">{language === "id" ? "HASHTAGS (Pisahkan koma)" : "HASHTAGS (Comma-separated)"}</span>
                <input
                  value={analysis.hashtags.join(", ")}
                  onChange={(e) => update("hashtags", e.target.value)}
                  placeholder="#otomasi, #marketing, #launch2026"
                />
              </label>

              <label>
                <span className="field-label">{language === "id" ? "CALL TO ACTION (CTA)" : "CALL TO ACTION"}</span>
                <input
                  value={analysis.cta}
                  onChange={(e) => update("cta", e.target.value)}
                  placeholder="https://automation-testing-theta.vercel.app/"
                />
              </label>
            </div>
          </div>

          {/* Prompt Action Buttons */}
          <div className="studio-actions">
            <button onClick={() => generate("Regenerate with more creative energy and hook.")} disabled={busy}>
              <RefreshCw size={14} /> {language === "id" ? "Generate Ulang" : "Regenerate"}
            </button>
            <button onClick={() => generate("Shorten and make the caption punchier.")} disabled={busy}>
              {language === "id" ? "Persingkat" : "Shorten"}
            </button>
            <button onClick={() => generate("Expand with full article structure.")} disabled={busy}>
              {language === "id" ? "Perpanjang" : "Expand"}
            </button>
            <button
              onClick={() => {
                const nextLang = language === "id" ? "en" : "id";
                setLanguage(nextLang);
                generate(`Translate the content into ${nextLang === "id" ? "Bahasa Indonesia" : "English"}.`);
              }}
              disabled={busy}
            >
              <Globe2 size={14} /> {language === "id" ? "Terjemahkan ke English" : "Translate to ID"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}