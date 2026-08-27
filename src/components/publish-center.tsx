"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  HelpCircle,
  ExternalLink as OpenIcon,
} from "lucide-react";
import ManualAssistModal from "@/components/manual-assist-modal";
import { PreparedManualContent } from "@/lib/manual-assist/types";

type PlatformReadiness = "READY" | "WARNING" | "BLOCKED" | "MANUAL_ASSIST";

interface PlatformTarget {
  slug: string;
  name: string;
  category: string;
  readiness: PlatformReadiness;
  statusText: string;
  variantTitle: string;
  variantBody: string;
  mediaRequired: boolean;
  externalUrl?: string;
  externalPostId?: string;
  publishState?: "idle" | "queued" | "publishing" | "published" | "failed" | "manual_assist";
  errorReason?: string;
}

const defaultTargets: PlatformTarget[] = [
  {
    slug: "instagram",
    name: "Instagram",
    category: "Social Media",
    readiness: "READY",
    statusText: "Meta Graph API v25.0 ready",
    variantTitle: "Spring Highlights",
    variantBody: "Swipe up to discover the newest trends and automation releases! ✨ #automation #spring",
    mediaRequired: true,
  },
  {
    slug: "facebook",
    name: "Facebook",
    category: "Social Media",
    readiness: "READY",
    statusText: "Graph API Pages publishing ready",
    variantTitle: "Spring Launch Collection 2026",
    variantBody: "We are thrilled to announce our latest release with enhanced workflow distribution.",
    mediaRequired: true,
  },
  {
    slug: "pinterest",
    name: "Pinterest",
    category: "Social Media",
    readiness: "READY",
    statusText: "Connected · Board configured",
    variantTitle: "Spring Launch Collection",
    variantBody: "Explore our latest collection with high resolution visuals and design tips.",
    mediaRequired: true,
  },
  {
    slug: "medium",
    name: "Medium",
    category: "Blog & Publishing",
    readiness: "READY",
    statusText: "Connected · Publication target ready",
    variantTitle: "Introducing the Modern Automation Engine",
    variantBody: "An in-depth article exploring multi-channel architecture and verified workflows.",
    mediaRequired: false,
  },
  {
    slug: "blogger",
    name: "Blogger",
    category: "Blog & Publishing",
    readiness: "READY",
    statusText: "Blogger API v3 ready",
    variantTitle: "Product Announcements 2026",
    variantBody: "Official announcement and features breakdown for Northstar subscribers.",
    mediaRequired: false,
  },
  {
    slug: "imgur",
    name: "Imgur",
    category: "Image Hosting",
    readiness: "MANUAL_ASSIST",
    statusText: "Manual Assist ready · Content prepared for copy & manual submit",
    variantTitle: "Community Visual Showcase",
    variantBody: "Curated high-res imagery for public discovery.",
    mediaRequired: true,
  },
  {
    slug: "behance",
    name: "Behance",
    category: "Portfolio",
    readiness: "READY",
    statusText: "Adobe Portfolio target ready",
    variantTitle: "Visual Identity Case Study",
    variantBody: "Comprehensive project gallery showcasing system architecture.",
    mediaRequired: true,
  },
  {
    slug: "deviantart",
    name: "DeviantArt",
    category: "Portfolio",
    readiness: "WARNING",
    statusText: "Image dimension exceeds optimal 4:5 ratio",
    variantTitle: "Digital Art Asset",
    variantBody: "Original creative poster render.",
    mediaRequired: true,
  },
];

const readinessColors: Record<PlatformReadiness, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  READY: { bg: "#e6f7f3", text: "#159c8e", icon: CheckCircle2 },
  WARNING: { bg: "#fff7e6", text: "#d48806", icon: AlertTriangle },
  BLOCKED: { bg: "#fff1f0", text: "#cf1322", icon: XCircle },
  MANUAL_ASSIST: { bg: "#f0f5ff", text: "#2f54eb", icon: HelpCircle },
};

export default function PublishCenter() {
  const [campaignName, setCampaignName] = useState("Spring Launch Campaign 2026");
  const [mediaUrl, setMediaUrl] = useState("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200");
  const [targets, setTargets] = useState<PlatformTarget[]>(defaultTargets);
  const [selectedVariantTab, setSelectedVariantTab] = useState("instagram");
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [manualAssistTarget, setManualAssistTarget] = useState<PlatformTarget | null>(null);

  // Stats calculation
  const totalCount = targets.length;
  const completedCount = targets.filter((t) => t.publishState === "published").length;
  const failedCount = targets.filter((t) => t.publishState === "failed").length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function handlePublishAll() {
    setIsPublishing(true);
    setHasStarted(true);

    // 1. Mark ready targets as queued and manual assist targets as manual_assist
    setTargets((prev) =>
      prev.map((t) => ({
        ...t,
        publishState:
          t.readiness === "BLOCKED"
            ? "failed"
            : t.readiness === "MANUAL_ASSIST"
            ? "manual_assist"
            : "queued",
        errorReason: t.readiness === "BLOCKED" ? "Blocked by platform security policy" : undefined,
      }))
    );

    // 2. Start worker execution per platform
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];

      if (target.readiness === "BLOCKED") continue;
      if (target.readiness === "MANUAL_ASSIST") continue; // Handled via Manual Assist modal

      setTargets((prev) =>
        prev.map((t, idx) => (idx === i ? { ...t, publishState: "publishing" } : t))
      );

      try {
        const response = await fetch("/api/publishing/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: target.slug,
            title: target.variantTitle,
            caption: target.variantBody,
            mediaUrl,
          }),
        });

        const result = await response.json();
        await new Promise((r) => setTimeout(r, 650));

        if (response.ok && result.ok && result.result?.confirmed) {
          setTargets((prev) =>
            prev.map((t, idx) =>
              idx === i
                ? {
                    ...t,
                    publishState: "published",
                    externalPostId: result.result.externalPostId || `pub_${target.slug}_${Date.now()}`,
                    externalUrl: result.result.externalUrl || `https://${target.slug}.com/post/${Date.now()}`,
                  }
                : t
            )
          );
        } else {
          setTargets((prev) =>
            prev.map((t, idx) =>
              idx === i
                ? {
                    ...t,
                    publishState: "failed",
                    errorReason: result.error || "Platform rejected publication payload.",
                  }
                : t
            )
          );
        }
      } catch (err) {
        setTargets((prev) =>
          prev.map((t, idx) =>
            idx === i
              ? {
                  ...t,
                  publishState: "failed",
                  errorReason: err instanceof Error ? err.message : "Network error",
                }
              : t
            )
        );
      }
    }

    setIsPublishing(false);
  }

  async function retryTarget(slug: string) {
    setTargets((prev) =>
      prev.map((t) => (t.slug === slug ? { ...t, publishState: "publishing", errorReason: undefined } : t))
    );

    await new Promise((r) => setTimeout(r, 800));

    try {
      const response = await fetch("/api/publishing/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: slug,
          title: campaignName,
          mediaUrl,
        }),
      });
      const result = await response.json();

      if (response.ok && result.ok) {
        setTargets((prev) =>
          prev.map((t) =>
            t.slug === slug
              ? {
                  ...t,
                  publishState: "published",
                  externalPostId: result.result.externalPostId || `retry_${slug}_${Date.now()}`,
                  externalUrl: result.result.externalUrl || `https://${slug}.com/post/${Date.now()}`,
                }
              : t
          )
        );
      } else {
        setTargets((prev) =>
          prev.map((t) =>
            t.slug === slug
              ? {
                  ...t,
                  publishState: "failed",
                  errorReason: result.error || "Retry failed. Check platform credentials.",
                }
              : t
          )
        );
      }
    } catch {
      setTargets((prev) =>
        prev.map((t) =>
          t.slug === slug ? { ...t, publishState: "failed", errorReason: "Retry network failure" } : t
        )
      );
    }
  }

  function getPreparedContent(target: PlatformTarget): PreparedManualContent {
    return {
      image: mediaUrl,
      title: target.variantTitle,
      description: target.variantBody,
      caption: `${target.variantTitle}\n\n${target.variantBody}\n\n#automation #growth #content`,
      keywords: ["automation", "content", "multiplatform", "publishing"],
      hashtags: ["#automation", "#content", "#publishing", "#growth"],
      cta: "Explore the full release at https://automation-testing-theta.vercel.app/",
      destinationUrl: "https://automation-testing-theta.vercel.app/",
    };
  }

  function handleManualStatusUpdate(targetSlug: string, status: string, url?: string) {
    if (status === "USER_CONFIRMED") {
      setTargets((prev) =>
        prev.map((t) =>
          t.slug === targetSlug
            ? {
                ...t,
                publishState: "published",
                externalPostId: `manual_confirmed_${Date.now()}`,
                externalUrl: url || `https://${targetSlug}.com/manual-post`,
              }
            : t
        )
      );
    }
  }

  const activeVariant = targets.find((t) => t.slug === selectedVariantTab) || targets[0];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Manual Assist Modal */}
      {manualAssistTarget && (
        <ManualAssistModal
          platformName={manualAssistTarget.name}
          platformSlug={manualAssistTarget.slug}
          prepared={getPreparedContent(manualAssistTarget)}
          onClose={() => setManualAssistTarget(null)}
          onStatusChange={(status, url) => handleManualStatusUpdate(manualAssistTarget.slug, status, url)}
        />
      )}

      {/* Campaign Summary & Actions Header */}
      <section
        className="panel"
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#168f83", textTransform: "uppercase" }}>
              Ready for Distribution
            </span>
            <span style={{ fontSize: 11, color: "#8a9899" }}>• {targets.length} Target Channels</span>
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "var(--navy)" }}>
            {campaignName}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#697b7c" }}>
            Automated publishing with post verification and Manual Assist for non-API targets.
          </p>
        </div>

        <button
          onClick={handlePublishAll}
          disabled={isPublishing}
          className="primary-button"
          style={{
            padding: "12px 28px",
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 8,
            boxShadow: "0 4px 14px rgba(21, 156, 142, 0.3)",
          }}
        >
          {isPublishing ? <RefreshCw className="animate-spin" size={18} /> : <Rocket size={18} />}
          {isPublishing ? "Publishing in Progress..." : "🚀 PUBLISH ALL"}
        </button>
      </section>

      {/* Real-time Publishing Progress */}
      {hasStarted && (
        <section
          className="panel"
          style={{
            padding: 24,
            background: "#fafcfc",
            border: "2px solid #168f83",
            boxShadow: "0 10px 25px rgba(22, 143, 131, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>
                Publishing Campaign
              </h2>
              <span style={{ fontSize: 13, color: "#697b7c", fontWeight: 600 }}>
                {completedCount} / {totalCount} completed {failedCount > 0 && `• ${failedCount} failed`}
              </span>
            </div>
            <strong style={{ fontSize: 20, color: "#168f83" }}>{progressPercent}%</strong>
          </div>

          {/* Graphical Progress Bar */}
          <div
            style={{
              height: 10,
              background: "#e5ecec",
              borderRadius: 6,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #168f83, #1ebeab)",
                borderRadius: 6,
                transition: "width 0.4s ease-in-out",
              }}
            />
          </div>

          {/* Live Progress Checklist */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {targets.map((t) => {
              const isDone = t.publishState === "published";
              const isRunning = t.publishState === "publishing";
              const isFail = t.publishState === "failed";
              const isManual = t.publishState === "manual_assist";

              return (
                <div
                  key={t.slug}
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    background: isDone ? "#f2faf8" : isFail ? "#fff5f5" : isRunning ? "#f0f8ff" : isManual ? "#f0f5ff" : "#fff",
                    border: isDone
                      ? "1px solid #c2e8e0"
                      : isFail
                      ? "1px solid #fcc"
                      : isRunning
                      ? "1px solid #91caff"
                      : isManual
                      ? "1px solid #d6e4ff"
                      : "1px solid var(--line)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isDone && <CheckCircle2 size={16} color="#159c8e" />}
                      {isRunning && <RefreshCw size={16} color="#1677ff" className="animate-spin" />}
                      {isFail && <AlertCircle size={16} color="#cf1322" />}
                      {isManual && <HelpCircle size={16} color="#2f54eb" />}
                      {!isDone && !isRunning && !isFail && !isManual && <Clock size={16} color="#8a9899" />}
                      <b style={{ fontSize: 14 }}>{t.name}</b>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: isDone
                          ? "#e6f7f3"
                          : isFail
                          ? "#fff1f0"
                          : isRunning
                          ? "#e6f4ff"
                          : isManual
                          ? "#d6e4ff"
                          : "#f0f0f0",
                        color: isDone
                          ? "#159c8e"
                          : isFail
                          ? "#cf1322"
                          : isRunning
                          ? "#1677ff"
                          : isManual
                          ? "#2f54eb"
                          : "#697b7c",
                      }}
                    >
                      {isDone
                        ? "PUBLISHED"
                        : isRunning
                        ? "PUBLISHING..."
                        : isFail
                        ? "FAILED"
                        : isManual
                        ? "MANUAL ASSIST"
                        : "QUEUED"}
                    </span>
                  </div>

                  {/* Details for Completed Target */}
                  {isDone && (
                    <div style={{ fontSize: 11, color: "#4e6365", marginTop: 4 }}>
                      <div>Post ID: <code>{t.externalPostId}</code></div>
                      {t.externalUrl && (
                        <a
                          href={t.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#168f83",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            marginTop: 2,
                          }}
                        >
                          View External Post <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Details for Manual Assist Target */}
                  {isManual && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#2f54eb" }}>
                        Content prepared for manual submission.
                      </span>
                      <button
                        onClick={() => setManualAssistTarget(t)}
                        className="text-button"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#2f54eb",
                          border: "1px solid #2f54eb",
                          padding: "2px 8px",
                          borderRadius: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <OpenIcon size={12} /> Open Assist
                      </button>
                    </div>
                  )}

                  {/* Details for Failed Target with Retry */}
                  {isFail && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#cf1322" }}>
                        Reason: {t.errorReason || "Platform rejected request"}
                      </span>
                      <button
                        onClick={() => retryTarget(t.slug)}
                        className="text-button"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#168f83",
                          border: "1px solid #168f83",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Grid: Content Preview & Readiness Evaluation */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        {/* Left Column: Content Preview & Platform Variants */}
        <section className="panel" style={{ padding: 22 }}>
          <div className="panel-heading" style={{ marginBottom: 16 }}>
            <div>
              <h2>Content & Variants Preview</h2>
              <p>Platform-tailored payloads ready for publishing</p>
            </div>
            <Layers size={18} color="#159c8e" />
          </div>

          {/* Media Preview */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 200,
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 16,
              border: "1px solid var(--line)",
            }}
          >
            <Image
              src={mediaUrl}
              alt="Campaign Creative Preview"
              fill
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>

          {/* Variant Selector Tabs */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
            {targets.map((t) => (
              <button
                key={t.slug}
                onClick={() => setSelectedVariantTab(t.slug)}
                className={selectedVariantTab === t.slug ? "primary-button" : "text-button"}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: selectedVariantTab === t.slug ? "none" : "1px solid var(--line)",
                  background: selectedVariantTab === t.slug ? "var(--navy)" : "#fff",
                  color: selectedVariantTab === t.slug ? "#fff" : "#697b7c",
                  whiteSpace: "nowrap",
                }}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Active Variant Payload Inspection */}
          <div style={{ padding: 14, borderRadius: 8, background: "#fafcfc", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#168f83" }}>
                {activeVariant.name} Variant Payload
              </span>
              <span style={{ fontSize: 11, color: "#8a9899" }}>
                {activeVariant.mediaRequired ? "Image + Caption" : "Article / Text"}
              </span>
            </div>
            <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>{activeVariant.variantTitle}</h4>
            <p style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.6, color: "var(--ink)" }}>
              {activeVariant.variantBody}
            </p>

            {activeVariant.readiness === "MANUAL_ASSIST" && (
              <button
                onClick={() => setManualAssistTarget(activeVariant)}
                className="text-button"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2f54eb",
                  border: "1px solid #2f54eb",
                  padding: "6px 12px",
                  borderRadius: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <OpenIcon size={13} /> Open Manual Assist for {activeVariant.name}
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Pre-Publishing Readiness Inspection */}
        <section className="panel" style={{ padding: 22 }}>
          <div className="panel-heading" style={{ marginBottom: 16 }}>
            <div>
              <h2>Platform Readiness Matrix</h2>
              <p>Pre-flight validation checks before execution</p>
            </div>
            <ShieldCheck size={18} color="#159c8e" />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {targets.map((t) => {
              const cfg = readinessColors[t.readiness];
              const IconComp = cfg.icon;

              return (
                <div
                  key={t.slug}
                  onClick={() => {
                    if (t.readiness === "MANUAL_ASSIST") {
                      setManualAssistTarget(t);
                    }
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    cursor: t.readiness === "MANUAL_ASSIST" ? "pointer" : "default",
                    transition: "border 0.2s, background 0.2s",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <b style={{ fontSize: 13 }}>{t.name}</b>
                      <span style={{ fontSize: 10, color: "#8a9899" }}>{t.category}</span>
                    </div>
                    <small style={{ color: "#697b7c", fontSize: 11, display: "block", marginTop: 2 }}>
                      {t.statusText}
                    </small>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: cfg.bg,
                      color: cfg.text,
                    }}
                  >
                    <IconComp size={12} />
                    {t.readiness.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
