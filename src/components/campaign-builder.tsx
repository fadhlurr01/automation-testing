"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock3,
  Image as ImageIcon,
  Save,
  Send,
  Sparkles,
  Link2,
  CheckCircle2,
  Loader2,
  Plus,
  Layers,
  PenTool,
  Globe,
  Calendar,
  Zap,
} from "lucide-react";

type Content = { id: string; title: string | null; caption: string | null };
type Media = { id: string; file_name: string; mime_type: string; signedUrl: string | null };
type Channel = {
  id: string;
  account_name: string;
  status: string;
  platforms: { id: string; name: string; slug: string; supports_image: boolean; supports_video: boolean };
};

const supportedPlatforms = [
  { slug: "pinterest", name: "Pinterest", type: "Pins & Boards", color: "#df6c47", bg: "#fff0eb" },
  { slug: "instagram", name: "Instagram", type: "Reels & Photos", color: "#b03a7a", bg: "#fcedf5" },
  { slug: "medium", name: "Medium", type: "Articles & Stories", color: "#1a8f82", bg: "#eef8f5" },
  { slug: "imgbb", name: "ImgBB", type: "Direct Image Host", color: "#3d70b8", bg: "#edf3fc" },
  { slug: "facebook", name: "Facebook", type: "Pages & Stories", color: "#3b5998", bg: "#eef2ff" },
  { slug: "twitter", name: "X / Twitter", type: "Posts & Media", color: "#1da1f2", bg: "#e8f5fd" },
  { slug: "postimages", name: "Postimages", type: "Image Hosting", color: "#2b8a3e", bg: "#ebfbee" },
  { slug: "publitio", name: "Publitio", type: "Cloud Media CDN", color: "#e8590c", bg: "#fff4e6" },
  { slug: "wattpad", name: "Wattpad", type: "Stories & Chapters", color: "#ff6600", bg: "#fff0e6" },
  { slug: "behance", name: "Behance", type: "Adobe Portfolio", color: "#1769ff", bg: "#e7f5ff" },
  { slug: "pixabay", name: "Pixabay", type: "Stock Visuals", color: "#00ab6b", bg: "#e6f8f1" },
  { slug: "unsplash", name: "Unsplash", type: "Visual Curation", color: "#111111", bg: "#f0f0f0" },
  { slug: "pexels", name: "Pexels", type: "Free Photo Library", color: "#05a081", bg: "#e6f7f3" },
];

const timezones = [
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB · UTC+7)" },
  { value: "Asia/Makassar", label: "Asia/Makassar (WITA · UTC+8)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (WIT · UTC+9)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT · UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST · UTC+9)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New York (EST/EDT)" },
];

export default function CampaignBuilder({ campaignId }: { campaignId?: string }) {
  const router = useRouter();

  // Workspace Data
  const [contents, setContents] = useState<Content[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  // Step 1: Campaign Details & Scheduling
  const [name, setName] = useState(campaignId ? "Campaign draft" : "");
  const [description, setDescription] = useState("");
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("schedule");
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [timezone, setTimezone] = useState("Asia/Jakarta");

  // Step 2: Content (Direct or Library)
  const [contentMode, setContentMode] = useState<"direct" | "saved">("direct");
  const [contentId, setContentId] = useState("");
  const [directTitle, setDirectTitle] = useState("");
  const [directCaption, setDirectCaption] = useState("");
  const [directTags, setDirectTags] = useState("");
  const [directLink, setDirectLink] = useState("");

  // Step 3: Media (Direct or Library)
  const [mediaMode, setMediaMode] = useState<"direct" | "library">("direct");
  const [mediaId, setMediaId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  // Step 4: Channels
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["pinterest", "medium", "imgbox", "instagram"]);

  // Status & Feedback
  const [notice, setNotice] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/content"), fetch("/api/media"), fetch("/api/channels")]).then(
      async ([contentRes, mediaRes, channelRes]) => {
        if (contentRes.ok) setContents((await contentRes.json()).content ?? []);
        if (mediaRes.ok) setMedia((await mediaRes.json()).assets ?? []);
        if (channelRes.ok) setChannels((await channelRes.json()).channels ?? []);
      }
    );
  }, []);

  function togglePlatform(slug: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  }

  const hasName = name.trim().length > 0;
  const hasContent = contentMode === "saved" ? Boolean(contentId) : Boolean(directTitle.trim() || directCaption.trim() || name.trim());
  const canSaveDraft = hasName;
  const canSchedule = hasName && hasContent && selectedPlatforms.length > 0;

  async function save(status: "draft" | "scheduled" | "approved") {
    if (!hasName) {
      setNotice({ message: "Please enter a campaign name.", type: "error" });
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      const scheduledIso =
        publishMode === "schedule" && scheduleDate && scheduleTime
          ? new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
          : status === "approved"
          ? new Date().toISOString()
          : null;

      const payload: Record<string, unknown> = {
        name,
        description,
        status,
        scheduledAt: scheduledIso,
        timezone,
        platformSlugs: selectedPlatforms,
      };

      if (contentMode === "saved" && contentId) {
        payload.contentId = contentId;
      } else {
        payload.directContent = {
          title: directTitle.trim() || name,
          caption: directCaption.trim(),
          body: directCaption.trim(),
          mediaUrl: mediaMode === "direct" ? mediaUrl.trim() : undefined,
          mediaAssetId: mediaMode === "library" ? mediaId || undefined : undefined,
          tags: directTags
            ? directTags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          link: directLink.trim() || undefined,
        };
      }

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // If scheduled or approved, create scheduled publishing jobs in backend
        if (result.campaign?.id && (status === "scheduled" || status === "approved")) {
          await fetch("/api/publishing/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campaignId: result.campaign.id,
              publishMode: status === "approved" ? "now" : "schedule",
              date: scheduleDate,
              time: scheduleTime,
              timezone,
            }),
          });
        }

        setNotice({
          message: `Campaign "${name}" saved successfully as ${status.toUpperCase()} (${timezone})!`,
          type: "success",
        });
      } else {
        setNotice({
          message: result.error || "Failed to save campaign.",
          type: "error",
        });
      }
    } catch (err) {
      setNotice({
        message: err instanceof Error ? err.message : "Network error.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="campaign-page">
      <header className="campaign-heading">
        <div>
          <Link
            href="/campaigns"
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
            <ArrowLeft size={15} /> Back to Campaigns
          </Link>
          <p className="eyebrow">CAMPAIGN SCHEDULER</p>
          <h1>{campaignId ? "Review campaign" : "Create & schedule campaign"}</h1>
          <p className="intro">
            Set campaign schedule in your local timezone, define content, and queue background workers.
          </p>
        </div>
        <div className="campaign-actions">
          <button onClick={() => save("draft")} disabled={busy || !canSaveDraft}>
            <Save size={15} />
            Save Draft
          </button>
          <button onClick={() => save("scheduled")} disabled={busy || !canSchedule}>
            <Clock3 size={15} />
            Schedule
          </button>
          <button className="primary-button" onClick={() => save("approved")} disabled={busy || !canSchedule}>
            <Send size={15} />
            Publish Now
          </button>
        </div>
      </header>

      {notice && (
        <div className={`channel-notice ${notice.type === "success" ? "channel-notice-success" : ""}`} style={{ marginBottom: 20 }}>
          {notice.type === "success" ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          <span>{notice.message}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {notice.type === "success" && (
              <>
                <Link
                  href="/calendar"
                  style={{
                    color: "#187a6f",
                    fontWeight: 700,
                    fontSize: 11,
                    textDecoration: "underline",
                  }}
                >
                  View in Calendar
                </Link>
                <Link
                  href="/campaigns"
                  style={{
                    color: "#187a6f",
                    fontWeight: 700,
                    fontSize: 11,
                    textDecoration: "underline",
                  }}
                >
                  Campaigns List
                </Link>
              </>
            )}
            <button onClick={() => setNotice(null)} aria-label="Dismiss notice">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="campaign-layout">
        {/* Left Form: Details, Scheduling, Content, Media */}
        <section className="campaign-form">
          {/* Step 01: Details & Scheduling */}
          <div className="campaign-step">
            <span>01</span>
            <div>
              <h2>Campaign Details & Timing</h2>
              <p>Name your campaign and choose when it will be published.</p>
            </div>
          </div>

          <input
            className="campaign-name"
            placeholder="Campaign name (e.g. Summer Promo, Product Update)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Publish Now vs Schedule Mode Toggle */}
          <div style={{ display: "flex", gap: 8, margin: "10px 0 14px" }}>
            <button
              type="button"
              onClick={() => setPublishMode("now")}
              className={publishMode === "now" ? "primary-button" : "text-button"}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: publishMode === "now" ? "none" : "1px solid var(--line)",
                background: publishMode === "now" ? "var(--navy)" : "#fff",
                color: publishMode === "now" ? "#fff" : "#697b7c",
              }}
            >
              <Zap size={13} /> Publish Now
            </button>
            <button
              type="button"
              onClick={() => setPublishMode("schedule")}
              className={publishMode === "schedule" ? "primary-button" : "text-button"}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: publishMode === "schedule" ? "none" : "1px solid var(--line)",
                background: publishMode === "schedule" ? "var(--navy)" : "#fff",
                color: publishMode === "schedule" ? "#fff" : "#697b7c",
              }}
            >
              <Calendar size={13} /> Schedule for Later
            </button>
          </div>

          {publishMode === "schedule" && (
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: "#f9fbfa",
                border: "1px solid #e0ebe9",
                display: "grid",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Publish Date</label>
                  <input
                    type="date"
                    className="campaign-name"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{ background: "#fff" }}
                  />
                </div>
                <div>
                  <label className="field-label">Publish Time</label>
                  <input
                    type="time"
                    className="campaign-name"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    style={{ background: "#fff" }}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Timezone (Default: Asia/Jakarta)</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    padding: "0 10px",
                    fontSize: 12,
                    background: "#fff",
                  }}
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 02: Content */}
          <div className="campaign-step" style={{ marginTop: 24 }}>
            <span>02</span>
            <div>
              <h2>Content & Copy</h2>
              <p>Write directly or pick from saved content drafts.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setContentMode("direct")}
              className={contentMode === "direct" ? "primary-button" : "text-button"}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: contentMode === "direct" ? "none" : "1px solid var(--line)",
                background: contentMode === "direct" ? "var(--navy)" : "#fff",
                color: contentMode === "direct" ? "#fff" : "#697b7c",
              }}
            >
              <PenTool size={13} /> Write Directly
            </button>
            <button
              type="button"
              onClick={() => setContentMode("saved")}
              className={contentMode === "saved" ? "primary-button" : "text-button"}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: contentMode === "saved" ? "none" : "1px solid var(--line)",
                background: contentMode === "saved" ? "var(--navy)" : "#fff",
                color: contentMode === "saved" ? "#fff" : "#697b7c",
              }}
            >
              <Layers size={13} /> Choose Saved Draft ({contents.length})
            </button>
          </div>

          {contentMode === "direct" ? (
            <div style={{ display: "grid", gap: 10 }}>
              <input
                className="campaign-name"
                placeholder="Post / Article Headline (Optional)"
                value={directTitle}
                onChange={(e) => setDirectTitle(e.target.value)}
              />
              <textarea
                className="campaign-name"
                placeholder="Enter caption, story copy, or campaign message..."
                value={directCaption}
                onChange={(e) => setDirectCaption(e.target.value)}
                rows={4}
                style={{ height: "auto", padding: "10px 12px", fontFamily: "inherit" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input
                  className="campaign-name"
                  placeholder="Tags (e.g. tech, news, promo)"
                  value={directTags}
                  onChange={(e) => setDirectTags(e.target.value)}
                />
                <input
                  className="campaign-name"
                  placeholder="Destination URL (e.g. https://...)"
                  value={directLink}
                  onChange={(e) => setDirectLink(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="choice-list">
              {contents.map((content) => (
                <button
                  type="button"
                  className={contentId === content.id ? "choice selected" : "choice"}
                  key={content.id}
                  onClick={() => setContentId(content.id)}
                >
                  <span className="choice-icon">
                    <Sparkles size={16} />
                  </span>
                  <span>
                    <b>{content.title || "Untitled content"}</b>
                    <small>{content.caption || "No caption"}</small>
                  </span>
                  {contentId === content.id && <Check size={16} />}
                </button>
              ))}
              {!contents.length && (
                <div style={{ padding: 14, background: "#fafcfc", borderRadius: 8, border: "1px dashed var(--line)", textAlign: "center" }}>
                  <p className="form-empty" style={{ margin: "0 0 8px" }}>No saved drafts found.</p>
                  <Link href="/content-studio" className="text-button" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Plus size={13} /> Create in Content Studio
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Step 03: Media */}
          <div className="campaign-step" style={{ marginTop: 24 }}>
            <span>03</span>
            <div>
              <h2>Media Attachment</h2>
              <p>Attach an image URL or choose from your media library.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setMediaMode("direct")}
              className={mediaMode === "direct" ? "primary-button" : "text-button"}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: mediaMode === "direct" ? "none" : "1px solid var(--line)",
                background: mediaMode === "direct" ? "var(--navy)" : "#fff",
                color: mediaMode === "direct" ? "#fff" : "#697b7c",
              }}
            >
              Direct URL / Link
            </button>
            <button
              type="button"
              onClick={() => setMediaMode("library")}
              className={mediaMode === "library" ? "primary-button" : "text-button"}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: mediaMode === "library" ? "none" : "1px solid var(--line)",
                background: mediaMode === "library" ? "var(--navy)" : "#fff",
                color: mediaMode === "library" ? "#fff" : "#697b7c",
              }}
            >
              Media Library ({media.length})
            </button>
          </div>

          {mediaMode === "direct" ? (
            <div>
              <input
                className="campaign-name"
                placeholder="Image/Video URL (e.g. https://images.unsplash.com/...)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
              <small style={{ color: "#778587", fontSize: 10, display: "block", marginTop: 4 }}>
                Public HTTPS media URLs are supported directly by Pinterest, Imgbox, Medium, and Instagram.
              </small>
            </div>
          ) : (
            <div className="media-choice">
              {media.map((asset) => (
                <button
                  type="button"
                  className={mediaId === asset.id ? "media-choice-item selected" : "media-choice-item"}
                  key={asset.id}
                  onClick={() => setMediaId(asset.id)}
                >
                  {asset.signedUrl && asset.mime_type.startsWith("image/") ? (
                    <Image src={asset.signedUrl} alt={asset.file_name} width={32} height={28} unoptimized />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                  <span>{asset.file_name}</span>
                  {mediaId === asset.id && <Check size={15} />}
                </button>
              ))}
              {!media.length && (
                <div style={{ padding: 14, background: "#fafcfc", borderRadius: 8, border: "1px dashed var(--line)", textAlign: "center", gridColumn: "span 2" }}>
                  <p className="form-empty" style={{ margin: "0 0 8px" }}>No uploaded assets available.</p>
                  <Link href="/media" className="text-button" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Plus size={13} /> Upload in Media Library
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Side: Channel Selection & Readiness Preview */}
        <section className="campaign-side">
          <div className="campaign-step">
            <span>04</span>
            <div>
              <h2>Select Publishing Channels</h2>
              <p>Choose target platforms for automated publishing.</p>
            </div>
          </div>

          <div className="channel-select-list">
            {supportedPlatforms.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.slug);
              const connectedAccount = channels.find(
                (c) => c.platforms?.slug === platform.slug && c.status === "connected"
              );

              return (
                <button
                  type="button"
                  className={isSelected ? "channel-select selected" : "channel-select"}
                  onClick={() => togglePlatform(platform.slug)}
                  key={platform.slug}
                  style={{ textAlign: "left" }}
                >
                  <span
                    className="channel-mini"
                    style={{ background: platform.bg, color: platform.color, fontWeight: 700 }}
                  >
                    {platform.name.slice(0, 1)}
                  </span>
                  <div>
                    <b>{platform.name}</b>
                    <small>
                      {connectedAccount ? (
                        <span style={{ color: "#168f83" }}>Connected: {connectedAccount.account_name}</span>
                      ) : (
                        <span>{platform.type} · Ready</span>
                      )}
                    </small>
                  </div>
                  {isSelected && <Check size={16} color="#159c8e" style={{ marginLeft: "auto" }} />}
                </button>
              );
            })}
          </div>

          <div className="preview-panel" style={{ marginTop: 20 }}>
            <div className="campaign-step">
              <span>05</span>
              <div>
                <h2>Campaign Schedule & Readiness</h2>
                <p>Scheduled execution: {publishMode === "schedule" ? `${scheduleDate} ${scheduleTime} (${timezone})` : "Instant Publish"}</p>
              </div>
            </div>

            <div className="preview-stats">
              <div>
                <b>{selectedPlatforms.length}</b>
                <span>Targets</span>
              </div>
              <div className="ready">
                <b>{timezone.split("/")[1] || timezone}</b>
                <span>Timezone</span>
              </div>
              <div className="manual">
                <b>{canSaveDraft ? "OK" : "--"}</b>
                <span>Draft Ready</span>
              </div>
              <div className="ready">
                <b>{canSchedule ? "YES" : "NO"}</b>
                <span>Schedule Ready</span>
              </div>
            </div>

            <div className="validation-line">
              {canSchedule ? (
                <>
                  <Check size={15} color="#159c8e" />
                  <span>Campaign is configured for {publishMode === "now" ? "immediate publish" : "automated schedule"}.</span>
                </>
              ) : (
                <>
                  <CircleAlert size={15} />
                  <span>Enter a campaign name to save as draft.</span>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
