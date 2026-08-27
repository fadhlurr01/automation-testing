"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  CheckCircle2,
  Loader2,
  Link2,
  Search,
  Unplug,
  Wifi,
  Key,
  ExternalLink,
  X,
  Sparkles,
  HelpCircle,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ManualAssistModal from "@/components/manual-assist-modal";
import { PreparedManualContent } from "@/lib/manual-assist/types";

type Channel = {
  name: string;
  slug: string;
  category: string;
  api: boolean;
  oauth: boolean;
  publish: boolean;
  upload: boolean;
  status: string;
  connectedAccountId?: string;
  username?: string;
  portalUrl?: string;
};

const groups = ["social", "blog_publishing", "image_hosting", "portfolio", "stock_visuals", "other"];
const labels: Record<string, string> = {
  social: "Social Media (7)",
  blog_publishing: "Blog & Publishing (7)",
  image_hosting: "Image & Media Hosting (14)",
  portfolio: "Portfolio & Creative (3)",
  stock_visuals: "Stock Visual Platforms (3)",
  other: "Community & Directory (3)",
};

// Step-by-step guides for obtaining API or connecting without API
export const platformGuides: Record<
  string,
  {
    requiresApi: boolean;
    portalName: string;
    portalUrl: string;
    steps: string[];
    note: string;
  }
> = {
  medium: {
    requiresApi: true,
    portalName: "Medium Security & Integration Tokens",
    portalUrl: "https://medium.com/me/settings/security",
    steps: [
      "Buka halaman Pengaturan Keamanan Medium: medium.com/me/settings/security",
      "Gulir ke bawah ke bagian 'Integration tokens'",
      "Ketik deskripsi token (contoh: 'Automation Hub')",
      "Klik tombol 'Get integration token' dan salin kodenya ke form di bawah.",
    ],
    note: "Token ini memungkinkan aplikasi membuat draf artikel resmi langsung ke akun Medium Anda.",
  },
  pinterest: {
    requiresApi: true,
    portalName: "Pinterest Developer Portal",
    portalUrl: "https://developers.pinterest.com/apps",
    steps: [
      "Buka Pinterest Developer Portal: developers.pinterest.com/apps",
      "Buat App baru atau pilih App yang sudah ada",
      "Masuk ke tab 'Trial Access' atau 'OAuth Keys'",
      "Generate Access Token dengan izin (scope): pins:read, pins:write, boards:read",
    ],
    note: "Diperlukan untuk membuat Pin gambar dan memilih Board secara otomatis.",
  },
  instagram: {
    requiresApi: true,
    portalName: "Meta for Developers (Instagram Graph API)",
    portalUrl: "https://developers.facebook.com/apps",
    steps: [
      "Buka Meta for Developers: developers.facebook.com/apps",
      "Buat App bertipe 'Business' dan tambahkan produk 'Instagram Graph API'",
      "Pastikan akun Instagram Anda bertipe Profesional/Bisnis dan ditautkan ke Facebook Page",
      "Dapatkan User Token via Graph API Explorer dengan izin: instagram_basic, instagram_content_publish",
    ],
    note: "Menggunakan Meta Graph API resmi v25.0 untuk mempublikasikan foto dan reels.",
  },
  facebook: {
    requiresApi: true,
    portalName: "Meta Graph API Explorer",
    portalUrl: "https://developers.facebook.com/tools/explorer",
    steps: [
      "Buka Meta Graph API Explorer",
      "Pilih Halaman Bisnis (Facebook Page) Anda",
      "Generate Page Access Token dengan izin: pages_show_list, pages_read_engagement, pages_manage_posts",
    ],
    note: "Digunakan untuk memposting otomatis ke Halaman Facebook.",
  },
  imgbb: {
    requiresApi: true,
    portalName: "ImgBB API Key Portal",
    portalUrl: "https://api.imgbb.com/",
    steps: [
      "Buka portal API ImgBB: api.imgbb.com",
      "Login menggunakan akun ImgBB Anda",
      "Klik tombol biru 'Get API key'",
      "Salin kunci 32 karakter yang muncul ke kolom token di bawah.",
    ],
    note: "Gratis dan langsung aktif tanpa masa tunggu verifikasi.",
  },
};

const defaultNoApiGuide = {
  requiresApi: false,
  portalName: "Direct Web & Manual Assist",
  portalUrl: "",
  steps: [
    "Platform ini TIDAK memerlukan API Key atau akun Developer berbayar.",
    "Cukup masukkan Nama Akun / Username Anda pada form di bawah untuk registrasi.",
    "Saat Anda ingin mempublikasikan konten, sistem akan menyiapkan 8 aset lengkap (Gambar HD, Judul, Deskripsi, Caption, Hashtag, Keywords, CTA, Link).",
    "Klik tombol [Salin] dan [Buka Platform] untuk memposting dalam 5 detik dengan aman tanpa risiko banned.",
  ],
  note: "Mode Manual Assist 100% aman, tidak melanggar aturan platform, dan tidak memerlukan biaya langganan API tambahan.",
};

// 37 Verified User Platforms
const verifiedPlatformDefinitions: Array<{ name: string; slug: string; category: string; portalUrl: string }> = [
  // Social Media
  { name: "Pinterest", slug: "pinterest", category: "social", portalUrl: "https://www.pinterest.com/" },
  { name: "Instagram", slug: "instagram", category: "social", portalUrl: "https://www.instagram.com/" },
  { name: "Facebook", slug: "facebook", category: "social", portalUrl: "https://www.facebook.com/" },
  { name: "X/Twitter", slug: "twitter", category: "social", portalUrl: "https://x.com/" },
  { name: "Minds", slug: "minds", category: "social", portalUrl: "https://www.minds.com/" },
  { name: "Flipboard", slug: "flipboard", category: "social", portalUrl: "https://flipboard.com/" },
  { name: "Tripadvisor", slug: "tripadvisor", category: "social", portalUrl: "https://www.tripadvisor.co.id/" },

  // Blog & Publishing
  { name: "Medium", slug: "medium", category: "blog_publishing", portalUrl: "https://medium.com/" },
  { name: "Wattpad", slug: "wattpad", category: "blog_publishing", portalUrl: "https://www.wattpad.com/" },
  { name: "Wix", slug: "wix", category: "blog_publishing", portalUrl: "https://id.wix.com/" },
  { name: "Penzu", slug: "penzu", category: "blog_publishing", portalUrl: "https://penzu.com/" },
  { name: "Weebly", slug: "weebly", category: "blog_publishing", portalUrl: "https://www.weebly.com/" },
  { name: "LiveJournal", slug: "livejournal", category: "blog_publishing", portalUrl: "https://livejournal.com/" },
  { name: "FlipHTML5", slug: "fliphtml5", category: "blog_publishing", portalUrl: "https://fliphtml5.com/" },

  // Image & Media Hosting
  { name: "ImgBB", slug: "imgbb", category: "image_hosting", portalUrl: "https://imgbb.com/" },
  { name: "Postimages", slug: "postimages", category: "image_hosting", portalUrl: "https://postimages.org/" },
  { name: "Publitio", slug: "publitio", category: "image_hosting", portalUrl: "https://publit.io/" },
  { name: "Prnt.sc", slug: "prntscr", category: "image_hosting", portalUrl: "https://prnt.sc/" },
  { name: "FreeImage.host", slug: "freeimage-host", category: "image_hosting", portalUrl: "https://freeimage.host/" },
  { name: "ImageShack", slug: "imageshack", category: "image_hosting", portalUrl: "https://imageshack.com/" },
  { name: "MediaFire", slug: "mediafire", category: "image_hosting", portalUrl: "https://mediafire.com/" },
  { name: "4shared", slug: "4shared", category: "image_hosting", portalUrl: "https://4shared.com/" },
  { name: "ImageBam", slug: "imagebam", category: "image_hosting", portalUrl: "https://imagebam.com/" },
  { name: "Shutterfly", slug: "shutterfly", category: "image_hosting", portalUrl: "https://shutterfly.com/" },
  { name: "TinyPic.host", slug: "tinypic", category: "image_hosting", portalUrl: "https://tinypic.host/" },
  { name: "Gifyu", slug: "gifyu", category: "image_hosting", portalUrl: "https://gifyu.com/" },
  { name: "Imgur", slug: "imgur", category: "image_hosting", portalUrl: "https://imgur.com/" },
  { name: "Google Photos", slug: "googlephotos", category: "image_hosting", portalUrl: "https://photos.google.com/" },

  // Portfolio, Curation & Discovery
  { name: "Behance", slug: "behance", category: "portfolio", portalUrl: "https://behance.net/" },
  { name: "500px", slug: "500px", category: "portfolio", portalUrl: "https://500px.com/" },
  { name: "Dropmark", slug: "dropmark", category: "portfolio", portalUrl: "https://dropmark.com/" },

  // Community, Directory & Experiences
  { name: "Locanto", slug: "locanto", category: "other", portalUrl: "https://locanto.co.id/" },
  { name: "Klook", slug: "klook", category: "other", portalUrl: "https://www.klook.com/" },
  { name: "Glints", slug: "glints", category: "other", portalUrl: "https://glints.com/" },

  // Stock Visual & Asset Platforms
  { name: "Pixabay", slug: "pixabay", category: "stock_visuals", portalUrl: "https://pixabay.com/" },
  { name: "Unsplash", slug: "unsplash", category: "stock_visuals", portalUrl: "https://unsplash.com/" },
  { name: "Pexels", slug: "pexels", category: "stock_visuals", portalUrl: "https://www.pexels.com/id-id/" },
];

const apiPlatforms = new Set(["Instagram", "Pinterest", "Medium", "Facebook", "ImgBB"]);
const oauthPlatforms = new Set(["Instagram", "Pinterest", "Medium", "Facebook"]);
const publishPlatforms = new Set(["Instagram", "Pinterest", "Medium", "Facebook", "ImgBB"]);

const initialChannels: Channel[] = verifiedPlatformDefinitions.map((p) => ({
  name: p.name,
  slug: p.slug,
  category: p.category,
  portalUrl: p.portalUrl,
  api: apiPlatforms.has(p.name),
  oauth: oauthPlatforms.has(p.name),
  publish: publishPlatforms.has(p.name),
  upload: true,
  status: "not_connected",
}));

export default function ChannelManager() {
  const [channelList, setChannelList] = useState<Channel[]>(initialChannels);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);

  // Direct Connect Modal
  const [activeModalChannel, setActiveModalChannel] = useState<Channel | null>(null);
  const [showGuideInModal, setShowGuideInModal] = useState(true);
  const [modalToken, setModalToken] = useState("");
  const [modalAccountName, setModalAccountName] = useState("");
  const [modalUsername, setModalUsername] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Manual Assist Modal
  const [manualAssistChannel, setManualAssistChannel] = useState<Channel | null>(null);

  async function loadConnected() {
    try {
      const response = await fetch("/api/channels");
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.channels)) {
        setChannelList((prev) =>
          prev.map((ch) => {
            const matched = data.channels.find(
              (c: { platforms?: { slug?: string; name?: string } }) =>
                c.platforms?.name?.toLowerCase() === ch.name.toLowerCase() ||
                c.platforms?.slug?.toLowerCase() === ch.slug.toLowerCase()
            );
            if (matched) {
              return {
                ...ch,
                status: matched.status || "connected",
                connectedAccountId: matched.id,
                username: matched.username || matched.account_name,
              };
            }
            return {
              ...ch,
              status: "not_connected",
              connectedAccountId: undefined,
              username: undefined,
            };
          })
        );
      }
    } catch {
      // Silently continue
    }
  }

  useEffect(() => {
    loadConnected();
  }, []);

  const filtered = useMemo(
    () =>
      channelList.filter(
        (channel) =>
          (filter === "all" || channel.category === filter) &&
          channel.name.toLowerCase().includes(search.toLowerCase())
      ),
    [channelList, filter, search]
  );

  async function handleOpenConnect(channel: Channel) {
    setActiveModalChannel(channel);
    setShowGuideInModal(true);
    setModalToken("");
    setModalAccountName("");
    setModalUsername("");
  }

  async function handleDirectConnectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeModalChannel) return;

    setConnecting(true);

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformSlug: activeModalChannel.slug,
          token: modalToken.trim(),
          accountName: modalAccountName.trim() || activeModalChannel.name,
          username: modalUsername.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setNotice({
          message: `✅ ${activeModalChannel.name} berhasil terhubung! Siap untuk distribusi konten.`,
          type: "success",
        });
        setActiveModalChannel(null);
        await loadConnected();
      } else {
        setNotice({
          message: result.error || `Gagal menghubungkan ${activeModalChannel.name}.`,
          type: "error",
        });
      }
    } catch (err) {
      setNotice({
        message: err instanceof Error ? err.message : "Koneksi gagal.",
        type: "error",
      });
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(channel: Channel) {
    if (!channel.connectedAccountId) return;
    try {
      const res = await fetch("/api/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: channel.connectedAccountId }),
      });
      if (res.ok) {
        setNotice({ message: `${channel.name} terputus.`, type: "success" });
        await loadConnected();
      } else {
        const err = await res.json();
        setNotice({ message: err.error || "Gagal memutuskan koneksi.", type: "error" });
      }
    } catch {
      setNotice({ message: "Kesalahan jaringan saat memutuskan.", type: "error" });
    }
  }

  async function handleTestConnection(channel: Channel) {
    setTestingPlatform(channel.slug);
    try {
      const response = await fetch("/api/publishing/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: channel.slug,
          title: "Connection Health Check",
        }),
      });

      const result = await response.json();
      if (response.ok && result.ok) {
        setNotice({
          message: `Health Check Berhasil: Adapter ${channel.name} siap dan terverifikasi!`,
          type: "success",
        });
      } else {
        setNotice({
          message: `Health Check Alert: ${result.error || "Platform melaporkan kendala."}`,
          type: "error",
        });
      }
    } catch {
      setNotice({ message: `Kesalahan jaringan saat menguji ${channel.name}.`, type: "error" });
    } finally {
      setTestingPlatform(null);
    }
  }

  function getPreparedMockContent(channel: Channel): PreparedManualContent {
    return {
      image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200",
      title: "Peluncuran Koleksi Eksklusif 2026",
      description: "Jelajahi alur kerja otomatisasi publikasi baru dengan distribusi multi-channel terpadu.",
      caption: "Peluncuran Koleksi Eksklusif 2026 ✨ Distribusi multi-platform kini aktif! #otomasi #marketing",
      keywords: ["otomasi", "marketing", "publikasi", "cloud"],
      hashtags: ["#otomasi", "#launch2026", "#marketing", "#tools"],
      cta: "Pelajari selengkapnya di https://automation-testing-theta.vercel.app/",
      destinationUrl: "https://automation-testing-theta.vercel.app/",
    };
  }

  const connectedTotal = channelList.filter((c) => c.status === "connected").length;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Manual Assist Modal */}
      {manualAssistChannel && (
        <ManualAssistModal
          platformName={manualAssistChannel.name}
          platformSlug={manualAssistChannel.slug}
          prepared={getPreparedMockContent(manualAssistChannel)}
          onClose={() => setManualAssistChannel(null)}
          onStatusChange={(status) => {
            if (status === "USER_CONFIRMED") {
              setNotice({
                message: `Publikasi berhasil dikonfirmasi secara manual di ${manualAssistChannel.name}!`,
                type: "success",
              });
            }
          }}
        />
      )}

      {/* Direct Connection Modal with Step-by-Step API Guide */}
      {activeModalChannel && (() => {
        const guide = platformGuides[activeModalChannel.slug] || defaultNoApiGuide;

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                maxWidth: 540,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 24,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                display: "grid",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Key size={20} color="#159c8e" />
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                    Hubungkan {activeModalChannel.name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalChannel(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8a9899" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Step-by-Step Guide Accordion */}
              <div
                style={{
                  background: guide.requiresApi ? "#f0f9ff" : "#f6fdfb",
                  border: guide.requiresApi ? "1px solid #bae6fd" : "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}
              >
                <div
                  onClick={() => setShowGuideInModal(!showGuideInModal)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    color: guide.requiresApi ? "#0369a1" : "#15803d",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <BookOpen size={14} />
                    {guide.requiresApi
                      ? "📖 Panduan Langkah Mendapatkan Token / API Key"
                      : "ℹ️ Informasi Koneksi: Tidak Memerlukan API Key"}
                  </span>
                  {showGuideInModal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {showGuideInModal && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#334155", display: "grid", gap: 6 }}>
                    <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
                      {guide.steps.map((st, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          {st}
                        </li>
                      ))}
                    </ol>

                    {guide.portalUrl && (
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={guide.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#0284c7",
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          Buka Portal Developer {activeModalChannel.name} ↗
                        </a>
                      </div>
                    )}

                    <div style={{ marginTop: 4, fontStyle: "italic", color: "#64748b", fontSize: 11 }}>
                      💡 {guide.note}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input */}
              <form onSubmit={handleDirectConnectSubmit} style={{ display: "grid", gap: 14 }}>
                <div>
                  <label className="field-label">Nama Akun / Display Name</label>
                  <input
                    className="campaign-name"
                    placeholder={`Contoh: @akun_${activeModalChannel.slug}_saya`}
                    value={modalAccountName}
                    onChange={(e) => setModalAccountName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Username (Opsional)</label>
                  <input
                    className="campaign-name"
                    placeholder="Contoh: arbi_creator"
                    value={modalUsername}
                    onChange={(e) => setModalUsername(e.target.value)}
                  />
                </div>

                {activeModalChannel.api ? (
                  <div>
                    <label className="field-label">
                      Integration Token / API Key ({activeModalChannel.name})
                    </label>
                    <input
                      type="password"
                      className="campaign-name"
                      placeholder="Tempel Access Token atau API Key Anda di sini"
                      value={modalToken}
                      onChange={(e) => setModalToken(e.target.value)}
                    />
                    <small style={{ color: "#8a9899", fontSize: 11, display: "block", marginTop: 4 }}>
                      🔒 Token disimpan terenkripsi di server (AES-256-GCM) dan tidak akan pernah bocor ke frontend.
                    </small>
                  </div>
                ) : (
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                      ✅ <b>Platform Siap Pakai</b>: Akun ini siap didistribusikan melalui sistem <b>Manual Assist</b> tanpa perlu memasukkan kunci API.
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModalChannel(null)}
                    className="text-button"
                    style={{ padding: "8px 16px", fontSize: 12 }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={connecting}
                    className="primary-button"
                    style={{ padding: "8px 20px", fontSize: 12 }}
                  >
                    {connecting ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    {connecting ? "Menghubungkan..." : "Konfirmasi & Simpan Akun"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Notice Banner */}
      {notice && (
        <div className={`channel-notice ${notice.type === "success" ? "channel-notice-success" : ""}`}>
          {notice.type === "success" ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Overview */}
      <section className="panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>
              Saluran Multi-Platform Terverifikasi (37 Platform Aktif)
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#697b7c" }}>
              Seluruh 37 akun aktif Anda siap untuk koneksi API langsung maupun Manual Assist (8 aset otomatis).
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#168f83", display: "block" }}>
                {connectedTotal} Akun Terhubung
              </span>
              <span style={{ fontSize: 10, color: "#8a9899" }}>37 Platform Siap Pakai</span>
            </div>
            <Link href="/publish" className="primary-button" style={{ fontSize: 12, padding: "8px 16px" }}>
              Ke Publish Center ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
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
        <div className="channel-search" style={{ minWidth: 260 }}>
          <Search size={16} />
          <input
            placeholder="Cari platform (misal: Pinterest, ImgBB, Medium, Wattpad, Pixabay)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilter("all")}
            className={filter === "all" ? "primary-button" : "text-button"}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              border: filter === "all" ? "none" : "1px solid var(--line)",
              background: filter === "all" ? "var(--navy)" : "#fff",
              color: filter === "all" ? "#fff" : "#697b7c",
            }}
          >
            Semua (37)
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={filter === g ? "primary-button" : "text-button"}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: filter === g ? "none" : "1px solid var(--line)",
                background: filter === g ? "var(--navy)" : "#fff",
                color: filter === g ? "#fff" : "#697b7c",
              }}
            >
              {labels[g]}
            </button>
          ))}
        </div>
      </section>

      {/* Grid of Verified Channels */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filtered.map((channel) => {
          const isConnected = channel.status === "connected";
          const isTesting = testingPlatform === channel.slug;
          const guide = platformGuides[channel.slug] || defaultNoApiGuide;

          return (
            <div
              key={channel.slug}
              className="panel"
              style={{
                padding: 18,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
                border: isConnected ? "1px solid #78c9be" : "1px solid var(--line)",
                background: isConnected ? "#fbfdfc" : "#fff",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>
                      {channel.name}
                    </h3>
                    <span style={{ fontSize: 11, color: "#8a9899" }}>{labels[channel.category] || channel.category}</span>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: isConnected ? "#e6f7f3" : "#f0f4f4",
                      color: isConnected ? "#159c8e" : "#697b7c",
                    }}
                  >
                    {isConnected ? "TERHUBUNG" : "SIAP PAKAI"}
                  </span>
                </div>

                {isConnected && channel.username && (
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#168f83", fontWeight: 600 }}>
                    Akun: {channel.username}
                  </p>
                )}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {channel.api && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: "#eef2ff", color: "#3b5998", padding: "1px 5px", borderRadius: 3 }}>
                      OFFICIAL API
                    </span>
                  )}
                  {channel.oauth && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: "#eef8f5", color: "#1a8f82", padding: "1px 5px", borderRadius: 3 }}>
                      OAUTH 2.0
                    </span>
                  )}
                  {!channel.api && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", padding: "1px 5px", borderRadius: 3 }}>
                      TANPA API (MANUAL ASSIST)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid #f0f4f4", paddingTop: 12 }}>
                {isConnected ? (
                  <>
                    <button
                      onClick={() => handleTestConnection(channel)}
                      disabled={isTesting}
                      className="text-button"
                      style={{ fontSize: 11, color: "#168f83", border: "1px solid #168f83", padding: "4px 8px", borderRadius: 4 }}
                    >
                      {isTesting ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                      Test
                    </button>
                    <button
                      onClick={() => handleDisconnect(channel)}
                      className="text-button"
                      style={{ fontSize: 11, color: "#cf1322", border: "1px solid #fcc", padding: "4px 8px", borderRadius: 4 }}
                    >
                      <Unplug size={12} /> Putus
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleOpenConnect(channel)}
                      className="primary-button"
                      style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5 }}
                    >
                      <Key size={12} /> Hubungkan Akun
                    </button>
                    <button
                      onClick={() => setManualAssistChannel(channel)}
                      className="text-button"
                      style={{ fontSize: 11, color: "#2f54eb", border: "1px solid #d6e4ff", padding: "5px 8px", borderRadius: 5 }}
                    >
                      <HelpCircle size={12} /> Assist
                    </button>
                  </>
                )}

                {channel.portalUrl && (
                  <a
                    href={channel.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: "auto", color: "#8a9899", display: "flex", alignItems: "center" }}
                    title="Buka situs platform"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
