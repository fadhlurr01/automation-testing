"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  CircleAlert,
  CheckCircle2,
  Loader2,
  Search,
  Unplug,
  Wifi,
  Key,
  ExternalLink,
  X,
  Sparkles,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import ManualAssistModal from "@/components/manual-assist-modal";
import { PreparedManualContent } from "@/lib/manual-assist/types";

type Channel = {
  name: string;
  slug: string;
  category: string;
  color: string;
  api: boolean;
  oauth: boolean;
  publish: boolean;
  upload: boolean;
  supportsVideo: boolean;
  supportsArticle: boolean;
  status: string;
  connectedAccountId?: string;
  username?: string;
  portalUrl: string;
};

const groups = ["all", "social", "blog_publishing", "image_hosting", "portfolio", "stock_visuals", "other"];
const labels: Record<string, string> = {
  all: "Semua Platform (37)",
  social: "Social Media (7)",
  blog_publishing: "Blog & Editorial (7)",
  image_hosting: "Image & Hosting (14)",
  portfolio: "Portfolio & Creative (3)",
  stock_visuals: "Stock Visual (3)",
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
      "Buka Meta Graph API Explorer: developers.facebook.com/tools/explorer",
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
    "Platform ini TIDAK memiliki API publik gratis atau melarang penggunaan bot otomatis.",
    "Jangan mencari API Key. Cukup daftarkan Nama Akun / Username Anda di bawah.",
    "Saat Anda ingin memposting, sistem akan otomatis menyiapkan 8 aset lengkap (Gambar HD, Judul, Deskripsi, Caption, Hashtag, Keywords, CTA, Link).",
    "Gunakan tombol [Salin] dan [Buka Platform] untuk mengunggah secara resmi dalam 5 detik.",
  ],
  note: "Sangat aman 100% dan bebas dari risiko banned/blokir bot.",
};

// 37 Verified User Platforms with Distinct Brand Colors
const verifiedPlatformDefinitions: Array<{
  name: string;
  slug: string;
  category: string;
  color: string;
  portalUrl: string;
  api?: boolean;
  oauth?: boolean;
  supportsVideo?: boolean;
  supportsArticle?: boolean;
}> = [
  // Social Media (Official API for Pinterest, Instagram, Facebook)
  { name: "Pinterest", slug: "pinterest", category: "social", color: "#E60023", portalUrl: "https://www.pinterest.com/", api: true, oauth: true, supportsVideo: true },
  { name: "Instagram", slug: "instagram", category: "social", color: "#E1306C", portalUrl: "https://www.instagram.com/", api: true, oauth: true, supportsVideo: true },
  { name: "Facebook", slug: "facebook", category: "social", color: "#1877F2", portalUrl: "https://www.facebook.com/", api: true, oauth: true, supportsVideo: true },
  // Non-API Social Media (Manual Assist)
  { name: "X / Twitter", slug: "twitter", category: "social", color: "#0f1419", portalUrl: "https://x.com/", supportsVideo: true },
  { name: "Minds", slug: "minds", category: "social", color: "#EBB300", portalUrl: "https://www.minds.com/", supportsVideo: true },
  { name: "Flipboard", slug: "flipboard", category: "social", color: "#E12828", portalUrl: "https://flipboard.com/", supportsArticle: true },
  { name: "Tripadvisor", slug: "tripadvisor", category: "social", color: "#00AA6C", portalUrl: "https://www.tripadvisor.co.id/" },

  // Blog & Publishing (Medium Official API, others Manual Assist)
  { name: "Medium", slug: "medium", category: "blog_publishing", color: "#000000", portalUrl: "https://medium.com/", api: true, oauth: true, supportsArticle: true },
  { name: "Wattpad", slug: "wattpad", category: "blog_publishing", color: "#FF6122", portalUrl: "https://www.wattpad.com/", supportsArticle: true },
  { name: "Wix", slug: "wix", category: "blog_publishing", color: "#0C6EFC", portalUrl: "https://id.wix.com/", supportsArticle: true },
  { name: "Penzu", slug: "penzu", category: "blog_publishing", color: "#0099FF", portalUrl: "https://penzu.com/", supportsArticle: true },
  { name: "Weebly", slug: "weebly", category: "blog_publishing", color: "#2990EA", portalUrl: "https://www.weebly.com/", supportsArticle: true },
  { name: "LiveJournal", slug: "livejournal", category: "blog_publishing", color: "#004359", portalUrl: "https://livejournal.com/", supportsArticle: true },
  { name: "FlipHTML5", slug: "fliphtml5", category: "blog_publishing", color: "#2B82EC", portalUrl: "https://fliphtml5.com/", supportsArticle: true },

  // Image & Media Hosting (ImgBB Official API, others Manual Assist)
  { name: "ImgBB", slug: "imgbb", category: "image_hosting", color: "#206095", portalUrl: "https://imgbb.com/", api: true },
  { name: "Postimages", slug: "postimages", category: "image_hosting", color: "#2B8A3E", portalUrl: "https://postimages.org/" },
  { name: "Publitio", slug: "publitio", category: "image_hosting", color: "#FF6B00", portalUrl: "https://publit.io/", supportsVideo: true },
  { name: "Prnt.sc", slug: "prntscr", category: "image_hosting", color: "#18A0FB", portalUrl: "https://prnt.sc/" },
  { name: "FreeImage.host", slug: "freeimage-host", category: "image_hosting", color: "#4A90E2", portalUrl: "https://freeimage.host/" },
  { name: "ImageShack", slug: "imageshack", category: "image_hosting", color: "#FF7700", portalUrl: "https://imageshack.com/", supportsVideo: true },
  { name: "MediaFire", slug: "mediafire", category: "image_hosting", color: "#1299F3", portalUrl: "https://mediafire.com/", supportsVideo: true },
  { name: "4shared", slug: "4shared", category: "image_hosting", color: "#0082CA", portalUrl: "https://4shared.com/", supportsVideo: true },
  { name: "ImageBam", slug: "imagebam", category: "image_hosting", color: "#6C5CE7", portalUrl: "https://imagebam.com/" },
  { name: "Shutterfly", slug: "shutterfly", category: "image_hosting", color: "#FF5722", portalUrl: "https://shutterfly.com/" },
  { name: "TinyPic.host", slug: "tinypic", category: "image_hosting", color: "#00B894", portalUrl: "https://tinypic.host/" },
  { name: "Gifyu", slug: "gifyu", category: "image_hosting", color: "#E84393", portalUrl: "https://gifyu.com/" },
  { name: "Imgur", slug: "imgur", category: "image_hosting", color: "#1BB76E", portalUrl: "https://imgur.com/", supportsVideo: true },
  { name: "Google Photos", slug: "googlephotos", category: "image_hosting", color: "#4285F4", portalUrl: "https://photos.google.com/", supportsVideo: true },

  // Portfolio, Curation & Discovery (Manual Assist)
  { name: "Behance", slug: "behance", category: "portfolio", color: "#1769FF", portalUrl: "https://behance.net/", supportsArticle: true },
  { name: "500px", slug: "500px", category: "portfolio", color: "#000000", portalUrl: "https://500px.com/" },
  { name: "Dropmark", slug: "dropmark", category: "portfolio", color: "#3D5AFE", portalUrl: "https://dropmark.com/", supportsArticle: true },

  // Community, Directory & Experiences (Manual Assist)
  { name: "Locanto", slug: "locanto", category: "other", color: "#E64A19", portalUrl: "https://locanto.co.id/" },
  { name: "Klook", slug: "klook", category: "other", color: "#FF5B00", portalUrl: "https://www.klook.com/" },
  { name: "Glints", slug: "glints", category: "other", color: "#ED1C24", portalUrl: "https://glints.com/" },

  // Stock Visual & Asset Platforms (Manual Assist)
  { name: "Pixabay", slug: "pixabay", category: "stock_visuals", color: "#00AB6B", portalUrl: "https://pixabay.com/" },
  { name: "Unsplash", slug: "unsplash", category: "stock_visuals", color: "#111111", portalUrl: "https://unsplash.com/" },
  { name: "Pexels", slug: "pexels", category: "stock_visuals", color: "#05A081", portalUrl: "https://www.pexels.com/id-id/" },
];

const initialChannels: Channel[] = verifiedPlatformDefinitions.map((p) => ({
  name: p.name,
  slug: p.slug,
  category: p.category,
  color: p.color,
  portalUrl: p.portalUrl,
  api: !!p.api,
  oauth: !!p.oauth,
  publish: true,
  upload: true,
  supportsVideo: !!p.supportsVideo,
  supportsArticle: !!p.supportsArticle,
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
      // Continue silently
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
          channel.name.toLowerCase().includes(search.toLowerCase().trim())
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
          token: activeModalChannel.api ? modalToken.trim() : undefined,
          accountName: modalAccountName.trim() || activeModalChannel.name,
          username: modalUsername.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setNotice({
          message: `✅ Akun ${activeModalChannel.name} berhasil didaftarkan dan siap untuk publikasi!`,
          type: "success",
        });
        setActiveModalChannel(null);
        await loadConnected();
      } else {
        setNotice({
          message: result.error || `Gagal mendaftarkan ${activeModalChannel.name}.`,
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

      {/* Direct Connection Modal */}
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
                borderRadius: 16,
                maxWidth: 540,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 24,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "grid",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: activeModalChannel.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {activeModalChannel.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                      {guide.requiresApi ? `Hubungkan API ${activeModalChannel.name}` : `Daftarkan Akun ${activeModalChannel.name}`}
                    </h3>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {labels[activeModalChannel.category] || activeModalChannel.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalChannel(null)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 6,
                    padding: 6,
                    cursor: "pointer",
                    color: "#64748b",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Guide Accordion or Anti-Bot Warning */}
              {guide.requiresApi ? (
                <div
                  style={{
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: 10,
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
                      color: "#0369a1",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <BookOpen size={15} />
                      📖 Panduan Langkah Mendapatkan Token / API Key Resmi
                    </span>
                    {showGuideInModal ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>

                  {showGuideInModal && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#334155", display: "grid", gap: 8 }}>
                      <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
                        {guide.steps.map((st, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>
                            {st}
                          </li>
                        ))}
                      </ol>

                      {guide.portalUrl && (
                        <div style={{ marginTop: 4 }}>
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

                      <div style={{ marginTop: 2, fontStyle: "italic", color: "#64748b", fontSize: 11 }}>
                        💡 {guide.note}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-API Platform Anti-Bot & Safety Warning */
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 10,
                    padding: "14px",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#b45309", fontWeight: 800, fontSize: 13 }}>
                    <ShieldAlert size={18} />
                    <span>🛡️ Peringatan Keamanan & Anti-Bot Protection</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
                    Platform <b>{activeModalChannel.name}</b> tidak menyediakan API posting publik gratis dan memiliki sistem proteksi bot / CAPTCHA yang ketat.
                  </p>
                  <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 8, border: "1px solid #fef3c7", fontSize: 11, color: "#78350f" }}>
                    <b>⚠️ Jangan gunakan script robot / botting ilegal</b>: Akun Anda berisiko terdeteksi dan di-suspend atau terkena banned permanen oleh platform.
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldCheck size={16} /> Solusi Aman 100%: Sistem akan menyiapkan 8 aset lengkap dan tombol salin 1-klik untuk publikasi resmi tanpa risiko banned.
                  </p>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleDirectConnectSubmit} style={{ display: "grid", gap: 14 }}>
                <div>
                  <label className="field-label" style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 12, color: "#334155" }}>
                    Nama Akun / Display Name
                  </label>
                  <input
                    placeholder={`Contoh: @akun_${activeModalChannel.slug}_saya`}
                    value={modalAccountName}
                    onChange={(e) => setModalAccountName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label className="field-label" style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 12, color: "#334155" }}>
                    Username (Opsional)
                  </label>
                  <input
                    placeholder="Contoh: arbi_creator"
                    value={modalUsername}
                    onChange={(e) => setModalUsername(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>

                {/* ONLY SHOW TOKEN INPUT IF PLATFORM HAS OFFICIAL API */}
                {activeModalChannel.api && (
                  <div>
                    <label className="field-label" style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 12, color: "#334155" }}>
                      Integration Token / API Key ({activeModalChannel.name})
                    </label>
                    <input
                      type="password"
                      placeholder="Tempel Access Token atau API Key Anda di sini"
                      value={modalToken}
                      onChange={(e) => setModalToken(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <small style={{ color: "#64748b", fontSize: 11, display: "block", marginTop: 4 }}>
                      🔒 Token disimpan terenkripsi di server (AES-256-GCM) dan aman.
                    </small>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModalChannel(null)}
                    style={{
                      padding: "9px 16px",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      color: "#475569",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={connecting}
                    style={{
                      padding: "9px 20px",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "none",
                      background: "#168f83",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {connecting ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    {connecting ? "Menyimpan..." : activeModalChannel.api ? "Konfirmasi & Hubungkan API" : "Simpan Akun Saya"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Notice Banner */}
      {notice && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: notice.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: notice.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
            color: notice.type === "success" ? "#065f46" : "#991b1b",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
          <span>{notice.message}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Overview */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
            Saluran Multi-Platform Terverifikasi (37 Platform Aktif)
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Kelola koneksi API resmi dan alur kerja Manual Assist 8-aset untuk 37 platform aktif Anda.
          </p>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#168f83", display: "block" }}>
              {connectedTotal} Akun Terdaftar
            </span>
            <span style={{ fontSize: 11, color: "#64748b" }}>37 Platform Siap Pakai</span>
          </div>
          <Link
            href="/publish"
            style={{
              padding: "9px 18px",
              background: "#168f83",
              color: "#fff",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(22,143,131,0.25)",
            }}
          >
            Ke Publish Center ↗
          </Link>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 280, flex: "1 1 280px" }}>
          <Search size={16} color="#94a3b8" />
          <input
            placeholder="Cari platform (misal: Pinterest, ImgBB, Medium, Wattpad, Pixabay)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {groups.map((g) => {
            const isSelected = filter === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setFilter(g)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: isSelected ? 700 : 600,
                  cursor: "pointer",
                  border: isSelected ? "none" : "1px solid #e2e8f0",
                  background: isSelected ? "#0f172a" : "#fff",
                  color: isSelected ? "#fff" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                {labels[g]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid of Verified Channels */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 18,
        }}
      >
        {filtered.map((channel) => {
          const isConnected = channel.status === "connected";
          const isTesting = testingPlatform === channel.slug;

          return (
            <div
              key={channel.slug}
              style={{
                background: isConnected ? "#fbfdfc" : "#fff",
                border: isConnected ? "1.5px solid #168f83" : "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 16,
                boxShadow: isConnected ? "0 4px 14px rgba(22, 143, 131, 0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              {/* Card Header */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: channel.color,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 17,
                        boxShadow: `0 3px 8px ${channel.color}40`,
                      }}
                    >
                      {channel.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                        {channel.name}
                      </h3>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                        {labels[channel.category] || channel.category}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: isConnected ? "#ecfdf5" : "#f1f5f9",
                      color: isConnected ? "#059669" : "#475569",
                      border: isConnected ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                    }}
                  >
                    {isConnected ? "TERHUBUNG" : "SIAP PAKAI"}
                  </span>
                </div>

                {isConnected && channel.username && (
                  <div style={{ background: "#f0fdf4", padding: "6px 10px", borderRadius: 6, marginBottom: 10, border: "1px solid #bbf7d0" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#15803d", fontWeight: 700 }}>
                      Akun: @{channel.username}
                    </p>
                  </div>
                )}

                {/* Capability Badges */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {channel.api ? (
                    <span style={{ fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", padding: "3px 7px", borderRadius: 4, border: "1px solid #bfdbfe" }}>
                      OFFICIAL API
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", padding: "3px 7px", borderRadius: 4, border: "1px solid #bbf7d0" }}>
                      MANUAL ASSIST (ANTI-BOT SAFE)
                    </span>
                  )}
                  {channel.oauth && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: "#f0fdfa", color: "#0f766e", padding: "3px 7px", borderRadius: 4, border: "1px solid #99f6e4" }}>
                      OAUTH 2.0
                    </span>
                  )}
                </div>

                {/* Features Support List */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 11, color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
                  <div>📸 Gambar: <b>Didukung</b></div>
                  <div>🎬 Video: <b>{channel.supportsVideo ? "Didukung" : "—"}</b></div>
                  <div>📄 Artikel: <b>{channel.supportsArticle ? "Didukung" : "—"}</b></div>
                  <div>🏷️ Tag & CTA: <b>Didukung</b></div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: 14,
                }}
              >
                {isConnected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTestConnection(channel)}
                      disabled={isTesting}
                      style={{
                        padding: "6px 10px",
                        fontSize: 11,
                        borderRadius: 6,
                        border: "1px solid #168f83",
                        background: "#fff",
                        color: "#168f83",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {isTesting ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                      Test
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect(channel)}
                      style={{
                        padding: "6px 10px",
                        fontSize: 11,
                        borderRadius: 6,
                        border: "1px solid #fecaca",
                        background: "#fff",
                        color: "#dc2626",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Unplug size={12} /> Putus
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenConnect(channel)}
                      style={{
                        padding: "7px 14px",
                        fontSize: 12,
                        borderRadius: 7,
                        border: "none",
                        background: "#168f83",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        boxShadow: "0 2px 6px rgba(22, 143, 131, 0.2)",
                      }}
                    >
                      {channel.api ? <Key size={13} /> : <UserPlus size={13} />}
                      {channel.api ? "Hubungkan API" : "Simpan Akun"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualAssistChannel(channel)}
                      style={{
                        padding: "7px 10px",
                        fontSize: 11,
                        borderRadius: 7,
                        border: "1px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <HelpCircle size={13} /> Assist
                    </button>
                  </>
                )}

                {channel.portalUrl && (
                  <a
                    href={channel.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      marginLeft: "auto",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      padding: 4,
                      borderRadius: 4,
                    }}
                    title={`Buka situs resmi ${channel.name}`}
                  >
                    <ExternalLink size={15} />
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
