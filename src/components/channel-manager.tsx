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
          message: `${activeModalChannel.name} connected successfully! Ready for automated publishing.`,
          type: "success",
        });
        setActiveModalChannel(null);
        await loadConnected();
      } else {
        setNotice({
          message: result.error || `Failed to connect ${activeModalChannel.name}.`,
          type: "error",
        });
      }
    } catch (err) {
      setNotice({
        message: err instanceof Error ? err.message : "Connection failed.",
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
        setNotice({ message: `${channel.name} disconnected.`, type: "success" });
        await loadConnected();
      } else {
        const err = await res.json();
        setNotice({ message: err.error || "Failed to disconnect.", type: "error" });
      }
    } catch {
      setNotice({ message: "Network error during disconnection.", type: "error" });
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
          message: `Health Check Passed: ${channel.name} adapter & publishing engine verified!`,
          type: "success",
        });
      } else {
        setNotice({
          message: `Health Check Alert: ${result.error || "Platform reported issue."}`,
          type: "error",
        });
      }
    } catch {
      setNotice({ message: `Health Check network error for ${channel.name}.`, type: "error" });
    } finally {
      setTestingPlatform(null);
    }
  }

  function getPreparedMockContent(channel: Channel): PreparedManualContent {
    return {
      image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200",
      title: "Spring Launch Collection 2026",
      description: "Explore the new automation workflow release with enhanced multi-channel distribution.",
      caption: "Spring Launch Collection 2026 ✨ Multi-platform publishing engine is live! #automation #growth",
      keywords: ["automation", "marketing", "publishing", "cloud"],
      hashtags: ["#automation", "#launch2026", "#marketing", "#tools"],
      cta: "Learn more at https://automation-testing-theta.vercel.app/",
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
                message: `Publication manually confirmed on ${manualAssistChannel.name}!`,
                type: "success",
              });
            }
          }}
        />
      )}

      {/* Direct Connection Modal */}
      {activeModalChannel && (
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
              maxWidth: 480,
              width: "100%",
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
                  Connect {activeModalChannel.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalChannel(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8a9899" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: "#697b7c", lineHeight: 1.5 }}>
              Enter your account username and access token/key to enable direct multi-channel distribution.
            </p>

            <form onSubmit={handleDirectConnectSubmit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label className="field-label">Account / Display Name</label>
                <input
                  className="campaign-name"
                  placeholder={`e.g. @my_${activeModalChannel.slug}_account`}
                  value={modalAccountName}
                  onChange={(e) => setModalAccountName(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">Username (Optional)</label>
                <input
                  className="campaign-name"
                  placeholder="e.g. creator_arbi"
                  value={modalUsername}
                  onChange={(e) => setModalUsername(e.target.value)}
                />
              </div>

              {activeModalChannel.api && (
                <div>
                  <label className="field-label">Integration Token / API Key (Optional)</label>
                  <input
                    type="password"
                    className="campaign-name"
                    placeholder="Enter API token or leave blank for direct web publishing"
                    value={modalToken}
                    onChange={(e) => setModalToken(e.target.value)}
                  />
                  <small style={{ color: "#8a9899", fontSize: 10, display: "block", marginTop: 4 }}>
                    Tokens are strictly encrypted with AES-256-GCM and never shared with the frontend.
                  </small>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveModalChannel(null)}
                  className="text-button"
                  style={{ padding: "8px 16px", fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="primary-button"
                  style={{ padding: "8px 20px", fontSize: 12 }}
                >
                  {connecting ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  {connecting ? "Connecting..." : "Confirm Connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Banner */}
      {notice && (
        <div className={`channel-notice ${notice.type === "success" ? "channel-notice-success" : ""}`}>
          {notice.type === "success" ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner Overview */}
      <section className="panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>
              Verified Multi-Platform Channels (37 Active Platforms)
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#697b7c" }}>
              All 37 verified accounts ready for API connection, media uploads, and Manual Assist publishing.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#168f83", display: "block" }}>
                {connectedTotal} Connected
              </span>
              <span style={{ fontSize: 10, color: "#8a9899" }}>37 Platforms Ready</span>
            </div>
            <Link href="/publish" className="primary-button" style={{ fontSize: 12, padding: "8px 16px" }}>
              Go to Publish Center ↗
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
            placeholder="Search 37 platforms (e.g. Pinterest, ImgBB, Wattpad, Pixabay)..."
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
            All (37)
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
                    {isConnected ? "CONNECTED" : "READY"}
                  </span>
                </div>

                {isConnected && channel.username && (
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#168f83", fontWeight: 600 }}>
                    Account: {channel.username}
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
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#f0f0f0", color: "#555", padding: "1px 5px", borderRadius: 3 }}>
                    MANUAL ASSIST READY
                  </span>
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
                      <Unplug size={12} /> Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleOpenConnect(channel)}
                      className="primary-button"
                      style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5 }}
                    >
                      <Key size={12} /> Connect Account
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
                    title="Open platform website"
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
