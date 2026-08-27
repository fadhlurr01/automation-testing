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
} from "lucide-react";

type Channel = {
  name: string;
  category: string;
  api: boolean;
  oauth: boolean;
  publish: boolean;
  upload: boolean;
  status: string;
  connectedAccountId?: string;
  username?: string;
};

const groups = ["social", "blog_publishing", "image_hosting", "cloud_storage", "portfolio", "other"];
const labels: Record<string, string> = {
  social: "Social media",
  blog_publishing: "Blog & publishing",
  image_hosting: "Image hosting",
  cloud_storage: "Cloud storage",
  portfolio: "Portfolio",
  other: "Other",
};

const names: [string, string][] = [
  ["Pinterest", "social"],
  ["Medium", "blog_publishing"],
  ["Imgbox", "image_hosting"],
  ["Publitio", "cloud_storage"],
  ["Postimages", "image_hosting"],
  ["Prnt.sc", "image_hosting"],
  ["Blogger", "blog_publishing"],
  ["FreeImage.host", "image_hosting"],
  ["ImgBB", "image_hosting"],
  ["ImageShack", "image_hosting"],
  ["MediaFire", "cloud_storage"],
  ["Tumblr", "social"],
  ["Flipboard", "blog_publishing"],
  ["500px", "portfolio"],
  ["Dropmark", "cloud_storage"],
  ["Behance", "portfolio"],
  ["4shared", "cloud_storage"],
  ["FlipHTML5", "blog_publishing"],
  ["ImageBam", "image_hosting"],
  ["Shutterfly", "image_hosting"],
  ["TinyPic.host", "image_hosting"],
  ["pCloud", "cloud_storage"],
  ["Instagram", "social"],
  ["LiveJournal", "blog_publishing"],
  ["Gifyu", "image_hosting"],
  ["Imgur", "image_hosting"],
  ["Google Photos", "cloud_storage"],
  ["Facebook", "social"],
  ["Minds", "social"],
  ["Locanto", "other"],
  ["X/Twitter", "social"],
  ["Wattpad", "blog_publishing"],
  ["Wix", "blog_publishing"],
  ["Penzu", "blog_publishing"],
  ["Weebly", "blog_publishing"],
  ["Ghost", "blog_publishing"],
  ["Klook", "other"],
  ["Glints", "other"],
  ["Tripadvisor", "social"],
  ["Squarespace", "blog_publishing"],
  ["Pixabay", "image_hosting"],
  ["Unsplash", "image_hosting"],
  ["Pexels", "image_hosting"],
  ["Reshot", "image_hosting"],
  ["Shopify Stock Photos", "image_hosting"],
  ["Pikwizard", "image_hosting"],
  ["Gratisography", "image_hosting"],
  ["StockVault", "image_hosting"],
  ["ImgPile", "image_hosting"],
  ["DeviantArt", "portfolio"],
];

const uploadable = new Set(["Imgbox", "Postimages", "FreeImage.host", "ImgBB", "ImageBam", "Gifyu", "Imgur", "ImgPile"]);
const apiPlatforms = new Set(["Instagram", "Pinterest", "Medium", "Imgbox"]);
const oauthPlatforms = new Set(["Instagram", "Pinterest", "Medium"]);
const publishPlatforms = new Set(["Instagram", "Pinterest", "Medium", "Imgbox"]);

const initialChannels: Channel[] = names.map(([name, category]) => ({
  name,
  category,
  api: apiPlatforms.has(name),
  oauth: oauthPlatforms.has(name),
  publish: publishPlatforms.has(name),
  upload: uploadable.has(name) || apiPlatforms.has(name),
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
                c.platforms?.slug?.toLowerCase() === ch.name.toLowerCase()
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
    const slug = channel.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // If Imgbox, direct 1-click connect immediately!
    if (slug === "imgbox") {
      setConnecting(true);
      try {
        const response = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platformSlug: "imgbox",
            accountName: "Imgbox Direct Host",
            username: "imgbox_uploader",
          }),
        });
        const result = await response.json();
        if (response.ok) {
          setNotice({ message: "Imgbox connected successfully for direct media uploads!", type: "success" });
          await loadConnected();
        } else {
          setNotice({ message: result.error || "Could not connect Imgbox.", type: "error" });
        }
      } finally {
        setConnecting(false);
      }
      return;
    }

    // Open connection modal with fields tailored for the platform
    setActiveModalChannel(channel);
    setModalToken("");
    setModalAccountName("");
    setModalUsername("");
  }

  async function handleDirectConnectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeModalChannel) return;

    setConnecting(true);
    const slug = activeModalChannel.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformSlug: slug,
          token: modalToken.trim(),
          accountName: modalAccountName.trim() || undefined,
          username: modalUsername.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setNotice({
          message: `${activeModalChannel.name} connected successfully! Your account is ready for automated publishing.`,
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

  async function handleOAuthRedirect(channel: Channel) {
    const platform = channel.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      const response = await fetch(`/api/oauth/${platform}/start?format=json`);
      const result = await response.json();
      if (response.ok && result.authorizationUrl) {
        window.location.assign(result.authorizationUrl);
      } else {
        // If developer OAuth is not configured, inform the user they can use Direct Token
        setNotice({
          message: `${result.error || "OAuth credentials not configured on Vercel"}. You can connect directly using your API / Integration Token below!`,
          type: "error",
        });
      }
    } catch {
      setNotice({
        message: "Could not initialize OAuth redirect. Please use direct token connection.",
        type: "error",
      });
    }
  }

  async function handleDisconnect(channel: Channel) {
    if (!channel.connectedAccountId) return;
    if (!confirm(`Are you sure you want to disconnect ${channel.name}?`)) return;

    try {
      const response = await fetch("/api/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: channel.connectedAccountId }),
      });
      if (response.ok) {
        setNotice({ message: `${channel.name} disconnected.`, type: "success" });
        await loadConnected();
      }
    } catch {
      setNotice({ message: "Failed to disconnect channel.", type: "error" });
    }
  }

  async function testConnection(channel: Channel) {
    const platformSlug = channel.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setTestingPlatform(channel.name);
    setNotice(null);

    try {
      const response = await fetch("/api/channels/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformSlug,
          connectedAccountId: channel.connectedAccountId,
        }),
      });

      const result = await response.json();
      if (response.ok && result.ok) {
        setNotice({
          message: `Connection verified! ${channel.name} account is active: ${
            result.username ? `@${result.username}` : result.accountName || "Ready"
          }`,
          type: "success",
        });
      } else {
        setNotice({
          message: `Connection test result: ${result.error || "Unable to reach platform API."}`,
          type: "error",
        });
      }
    } catch (err) {
      setNotice({
        message: `Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
        type: "error",
      });
    } finally {
      setTestingPlatform(null);
    }
  }

  function unavailable(name: string, action: string) {
    setNotice({
      message: `${action} is unavailable for ${name}. No OAuth or API adapter is configured.`,
      type: "error",
    });
  }

  return (
    <main className="channels-page">
      <header className="channels-heading">
        <div>
          <Link
            href="/dashboard"
            className="back-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "#168f83",
              textDecoration: "none",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <p className="eyebrow">CHANNEL MANAGER</p>
          <h1>Publishing connections</h1>
          <p className="intro">
            Connect your accounts via official API, Integration Tokens, or OAuth to enable multi-platform publishing.
          </p>
        </div>
        <div className="channel-count">
          <b>{channelList.filter((c) => c.status === "connected").length}</b>
          <span>active / {channelList.length} total</span>
        </div>
      </header>

      <div className="channel-toolbar">
        <div className="channel-search">
          <Search size={17} />
          <input
            placeholder="Search platforms..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter channel category"
        >
          <option value="all">All categories</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {labels[group]}
            </option>
          ))}
        </select>
      </div>

      {notice && (
        <div className={`channel-notice ${notice.type === "success" ? "channel-notice-success" : ""}`}>
          {notice.type === "success" ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss notice">
            Dismiss
          </button>
        </div>
      )}

      {/* Direct Connection Modal */}
      {activeModalChannel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 24, 26, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="panel"
            style={{
              width: "100%",
              maxWidth: 480,
              padding: 24,
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#159c8e", textTransform: "uppercase" }}>
                  Connect Channel
                </span>
                <h2 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 600 }}>
                  {activeModalChannel.name} Integration
                </h2>
              </div>
              <button
                onClick={() => setActiveModalChannel(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#697b7c" }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Guidance for specific platforms */}
            {activeModalChannel.name.toLowerCase() === "medium" && (
              <div style={{ padding: 12, borderRadius: 8, background: "#f2f8f7", fontSize: 12, lineHeight: 1.5, color: "#2d5254", marginBottom: 16 }}>
                💡 <b>How to get your Medium Token:</b> Go to Medium.com → <b>Settings</b> → <b>Security and apps</b> → <b>Integration tokens</b> → Create token and paste it below.
              </div>
            )}

            {activeModalChannel.name.toLowerCase() === "pinterest" && (
              <div style={{ padding: 12, borderRadius: 8, background: "#fff5f0", fontSize: 12, lineHeight: 1.5, color: "#8a432b", marginBottom: 16 }}>
                💡 <b>Pinterest API:</b> Enter your Pinterest API Access Token from developers.pinterest.com or your account username.
              </div>
            )}

            {activeModalChannel.name.toLowerCase() === "instagram" && (
              <div style={{ padding: 12, borderRadius: 8, background: "#fdf0f7", fontSize: 12, lineHeight: 1.5, color: "#7a2a5b", marginBottom: 16 }}>
                💡 <b>Instagram API:</b> Enter your Meta Graph API User Access Token or username to connect.
              </div>
            )}

            <form onSubmit={handleDirectConnectSubmit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label className="field-label">API Access / Integration Token</label>
                <input
                  type="password"
                  placeholder="Paste access token / integration key..."
                  value={modalToken}
                  onChange={(e) => setModalToken(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    fontSize: 12,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Account / Display Name</label>
                  <input
                    placeholder="e.g. My Workspace"
                    value={modalAccountName}
                    onChange={(e) => setModalAccountName(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: "1px solid var(--line)",
                      fontSize: 12,
                    }}
                  />
                </div>
                <div>
                  <label className="field-label">Username (Optional)</label>
                  <input
                    placeholder="e.g. your_handle"
                    value={modalUsername}
                    onChange={(e) => setModalUsername(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: "1px solid var(--line)",
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
                {activeModalChannel.oauth && (
                  <button
                    type="button"
                    onClick={() => handleOAuthRedirect(activeModalChannel)}
                    className="text-button"
                    style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <ExternalLink size={13} /> Or login with OAuth
                  </button>
                )}
                <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                  <button
                    type="button"
                    onClick={() => setActiveModalChannel(null)}
                    className="text-button"
                    style={{ padding: "8px 14px", fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={connecting}
                    className="primary-button"
                    style={{ padding: "8px 16px", fontSize: 12 }}
                  >
                    {connecting ? <Loader2 className="animate-spin" size={14} /> : <Key size={14} />}
                    {connecting ? "Connecting..." : "Save & Connect"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {groups.map((group) => {
        const channels = filtered.filter((item) => item.category === group);
        if (!channels.length) return null;

        return (
          <section className="channel-group" key={group}>
            <div className="group-heading">
              <h2>{labels[group]}</h2>
              <span>{channels.length} platforms</span>
            </div>

            <div className="channel-grid">
              {channels.map((channel) => {
                const isConnected = channel.status === "connected";
                const isTesting = testingPlatform === channel.name;

                return (
                  <article className={`channel-card ${isConnected ? "connected-card" : ""}`} key={channel.name}>
                    <div className="card-topline">
                      <div className="platform-name">
                        <span className="platform-avatar">{channel.name.slice(0, 1)}</span>
                        <div>
                          <strong>{channel.name}</strong>
                          <span className="platform-badge">{labels[channel.category]}</span>
                        </div>
                      </div>
                      <span className={`status-pill ${channel.status}`}>
                        {isConnected ? (
                          <>
                            <Check size={12} /> Connected
                          </>
                        ) : (
                          <>
                            <Unplug size={12} /> Not connected
                          </>
                        )}
                      </span>
                    </div>

                    {isConnected && channel.username && (
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#168f83", fontWeight: 600 }}>
                        @{channel.username.replace(/^@/, "")}
                      </p>
                    )}

                    <div className="capability-table">
                      <div className="cap-row">
                        <span>API adapter</span>
                        <b className={channel.api ? "supported" : "unsupported"}>
                          {channel.api ? "Available" : "No adapter"}
                        </b>
                      </div>
                      <div className="cap-row">
                        <span>OAuth 2.0</span>
                        <b className={channel.oauth ? "supported" : "unsupported"}>
                          {channel.oauth ? "Available" : "Not supported"}
                        </b>
                      </div>
                      <div className="cap-row">
                        <span>Automated publish</span>
                        <b className={channel.publish ? "supported" : "unsupported"}>
                          {channel.publish ? "Available" : "Manual only"}
                        </b>
                      </div>
                      <div className="cap-row">
                        <span>Media upload</span>
                        <b className={channel.upload ? "supported" : "unsupported"}>
                          {channel.upload ? "Available" : "Not supported"}
                        </b>
                      </div>
                    </div>

                    <div className="card-actions">
                      {isConnected ? (
                        <>
                          <button
                            type="button"
                            className="test-connection-button"
                            onClick={() => testConnection(channel)}
                            disabled={isTesting}
                            aria-label={`Test connection for ${channel.name}`}
                          >
                            {isTesting ? <Loader2 className="animate-spin" size={13} /> : <Wifi size={13} />}
                            {isTesting ? "Testing..." : "Test Connection"}
                          </button>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => handleDisconnect(channel)}
                            style={{ fontSize: 11, color: "#a84040", marginLeft: "auto" }}
                          >
                            Disconnect
                          </button>
                        </>
                      ) : channel.oauth || channel.api ? (
                        <button
                          type="button"
                          className="connect-button"
                          onClick={() => handleOpenConnect(channel)}
                          disabled={connecting}
                        >
                          <Link2 size={14} />
                          {channel.name === "Imgbox" ? "Connect Direct Host" : "Connect"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="unavailable-button"
                          onClick={() => unavailable(channel.name, "Connect")}
                        >
                          Unavailable
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
