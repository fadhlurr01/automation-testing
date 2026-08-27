"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, CheckCircle2, Loader2, Link2, Search, Unplug, Wifi } from "lucide-react";

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

  useEffect(() => {
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
              return ch;
            })
          );
        }
      } catch {
        // Silently continue if offline
      }
    }
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

  async function connect(name: string) {
    const platform = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const response = await fetch(`/api/oauth/${platform}/start?format=json`);
    const result = await response.json();
    if (!response.ok) {
      setNotice({ message: result.error ?? "Developer configuration required", type: "error" });
      return;
    }
    window.location.assign(result.authorizationUrl);
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
          message: `Connection successful! Verified ${channel.name} account: ${result.username ? `@${result.username}` : result.accountName || "Active"}`,
          type: "success",
        });
      } else {
        setNotice({
          message: `Connection test failed: ${result.error || "Unable to reach platform API."}`,
          type: "error",
        });
      }
    } catch (err) {
      setNotice({
        message: `Network error during connection test: ${err instanceof Error ? err.message : "Unknown error"}`,
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
          <p className="eyebrow">CHANNEL MANAGER</p>
          <h1>Publishing connections</h1>
          <p className="intro">
            A capability registry for your distribution workspace. Availability is shown honestly, per platform.
          </p>
        </div>
        <div className="channel-count">
          <b>{channelList.length}</b>
          <span>platforms tracked</span>
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

      {groups.map((group) => {
        const items = filtered.filter((channel) => channel.category === group);
        return items.length ? (
          <section className="channel-group" key={group}>
            <div className="channel-group-title">
              <h2>{labels[group]}</h2>
              <span>{items.length}</span>
            </div>
            <div className="channel-grid">
              {items.map((channel) => {
                const isTesting = testingPlatform === channel.name;
                return (
                  <article className="channel-card" key={channel.name}>
                    <div className="channel-card-top">
                      <span className="channel-logo">{channel.name.slice(0, 1)}</span>
                      <div>
                        <h3>{channel.name}</h3>
                        <p>
                          {channel.status === "connected"
                            ? `Connected${channel.username ? ` (@${channel.username})` : ""}`
                            : "Not connected"}
                        </p>
                      </div>
                      <span className={`connection-dot ${channel.status === "connected" ? "connected" : ""}`} />
                    </div>
                    <div className="capability-list">
                      <span className={channel.api ? "available" : "muted"}>
                        {channel.api ? <Check size={12} /> : <Unplug size={12} />}
                        {channel.api ? "API Available" : channel.upload ? "Manual Assist" : "Unsupported"}
                      </span>
                      <span className={channel.publish ? "available" : "muted"}>
                        <Wifi size={12} />
                        {channel.publish ? "Publishing" : "No publishing adapter"}
                      </span>
                    </div>
                    <div className="channel-actions">
                      <button onClick={() => connect(channel.name)}>
                        <Link2 size={14} />
                        {channel.status === "connected" ? "Reconnect" : "Connect"}
                      </button>
                      <button
                        onClick={() => (channel.api ? testConnection(channel) : unavailable(channel.name, "Test connection"))}
                        disabled={!channel.api || isTesting}
                      >
                        {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
                        {isTesting ? "Testing..." : "Test Connection"}
                      </button>
                      <button
                        onClick={() => unavailable(channel.name, "Disconnect")}
                        disabled={channel.status !== "connected"}
                        aria-label={`Disconnect ${channel.name}`}
                      >
                        <Unplug size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null;
      })}
    </main>
  );
}
