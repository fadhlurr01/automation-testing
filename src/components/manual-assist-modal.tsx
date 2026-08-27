"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Download,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  Link2,
} from "lucide-react";
import { ManualAssistStatus, PreparedManualContent, platformUploadUrls } from "@/lib/manual-assist/types";

interface ManualAssistModalProps {
  platformName: string;
  platformSlug: string;
  prepared: PreparedManualContent;
  onClose: () => void;
  onStatusChange?: (status: ManualAssistStatus, confirmedUrl?: string) => void;
  initialStatus?: ManualAssistStatus;
}

export default function ManualAssistModal({
  platformName,
  platformSlug,
  prepared,
  onClose,
  onStatusChange,
  initialStatus = "PREPARED",
}: ManualAssistModalProps) {
  const [status, setStatus] = useState<ManualAssistStatus>(initialStatus);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmedUrl, setConfirmedUrl] = useState("");
  const [showConfirmInput, setShowConfirmInput] = useState(false);

  const uploadUrl = platformUploadUrls[platformSlug.toLowerCase()] || `https://www.${platformSlug.toLowerCase()}.com/`;

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleOpenPlatform() {
    window.open(uploadUrl, "_blank", "noopener,noreferrer");
    if (status === "PREPARED") {
      setStatus("OPENED");
      onStatusChange?.("OPENED");
    }
  }

  function handleConfirmPublication() {
    setStatus("USER_CONFIRMED");
    onStatusChange?.("USER_CONFIRMED", confirmedUrl.trim() || undefined);
    setShowConfirmInput(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 24, 26, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div
        className="panel"
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          borderRadius: 14,
          background: "#fff",
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
          display: "grid",
          gap: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: "#f0f5ff",
                  color: "#2f54eb",
                }}
              >
                MANUAL ASSIST
              </span>
              <span style={{ fontSize: 11, color: "#8a9899" }}>• {platformName} Safe Distribution</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>
              Manual Publishing: {platformName}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#697b7c" }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Anti-Bot Security Banner */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "#fffbeb",
            border: "1px solid #fde68a",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ color: "#b45309", display: "flex", alignItems: "center" }}>
            <Sparkles size={20} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5, fontWeight: 500 }}>
            <b>🛡️ Perlindungan Akun Anti-Bot ({platformName}):</b> 8 aset konten telah disiapkan otomatis oleh AI. Mengunggah melalui tombol <b>[Buka Platform]</b> menjamin akun Anda 100% resmi, aman, dan bebas dari risiko terdeteksi robot/banned.
          </p>
        </div>

        {/* Status Tracker Stepper */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            padding: 12,
            background: "#f7faf9",
            borderRadius: 8,
            border: "1px solid #e2edeb",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#159c8e",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              ✓
            </span>
            <b style={{ fontSize: 11, color: "#159c8e" }}>PREPARED</b>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: status === "OPENED" || status === "USER_CONFIRMED" ? "#159c8e" : "#d0dada",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {status === "OPENED" || status === "USER_CONFIRMED" ? "✓" : "2"}
            </span>
            <b
              style={{
                fontSize: 11,
                color: status === "OPENED" || status === "USER_CONFIRMED" ? "#159c8e" : "#8a9899",
              }}
            >
              OPENED
            </b>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: status === "USER_CONFIRMED" ? "#159c8e" : "#d0dada",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {status === "USER_CONFIRMED" ? "✓" : "3"}
            </span>
            <b style={{ fontSize: 11, color: status === "USER_CONFIRMED" ? "#159c8e" : "#8a9899" }}>
              USER CONFIRMED
            </b>
          </div>
        </div>

        {/* 8 Prepared Elements */}
        <div style={{ display: "grid", gap: 12 }}>
          {/* 1. Image */}
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: 50,
                  height: 50,
                  borderRadius: 6,
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                }}
              >
                <Image src={prepared.image} alt="Prepared Media" fill style={{ objectFit: "cover" }} unoptimized />
              </div>
              <div>
                <span className="field-label" style={{ marginBottom: 2 }}>
                  1. Image Asset
                </span>
                <b style={{ fontSize: 12 }}>Visual Creative Prepared</b>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => copyText("image", prepared.image)}
                className="text-button"
                style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
              >
                {copiedKey === "image" ? <Check size={13} color="#159c8e" /> : <Copy size={13} />}
                {copiedKey === "image" ? "Copied URL!" : "Copy Image URL"}
              </button>
              <a
                href={prepared.image}
                target="_blank"
                rel="noreferrer"
                download
                className="text-button"
                style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
              >
                <Download size={13} /> Download
              </a>
            </div>
          </div>

          {/* 2. Title */}
          <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "#fafcfc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="field-label">2. Title</span>
              <button
                type="button"
                onClick={() => copyText("title", prepared.title)}
                className="text-button"
                style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
              >
                {copiedKey === "title" ? <Check size={13} color="#159c8e" /> : <Copy size={13} />}
                {copiedKey === "title" ? "Copied!" : "Copy Title"}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{prepared.title}</p>
          </div>

          {/* 3. Description */}
          <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "#fafcfc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="field-label">3. Description</span>
              <button
                type="button"
                onClick={() => copyText("desc", prepared.description)}
                className="text-button"
                style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
              >
                {copiedKey === "desc" ? <Check size={13} color="#159c8e" /> : <Copy size={13} />}
                {copiedKey === "desc" ? "Copied!" : "Copy Description"}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--ink)" }}>{prepared.description}</p>
          </div>

          {/* 4. Caption */}
          <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "#fafcfc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="field-label">4. Caption</span>
              <button
                type="button"
                onClick={() => copyText("caption", prepared.caption)}
                className="text-button"
                style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
              >
                {copiedKey === "caption" ? <Check size={13} color="#159c8e" /> : <Copy size={13} />}
                {copiedKey === "caption" ? "Copied!" : "Copy Caption"}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--ink)" }}>{prepared.caption}</p>
          </div>

          {/* 5. Keywords & 6. Hashtags */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "#fafcfc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span className="field-label">5. Keywords</span>
                <button
                  type="button"
                  onClick={() => copyText("keywords", prepared.keywords.join(", "))}
                  className="text-button"
                  style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}
                >
                  {copiedKey === "keywords" ? <Check size={12} color="#159c8e" /> : <Copy size={12} />}
                  {copiedKey === "keywords" ? "Copied!" : "Copy Keywords"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#4e6365" }}>{prepared.keywords.join(", ")}</p>
            </div>

            <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "#fafcfc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span className="field-label">6. Hashtags</span>
                <button
                  type="button"
                  onClick={() => copyText("hashtags", prepared.hashtags.join(" "))}
                  className="text-button"
                  style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}
                >
                  {copiedKey === "hashtags" ? <Check size={12} color="#159c8e" /> : <Copy size={12} />}
                  {copiedKey === "hashtags" ? "Copied!" : "Copy Hashtags"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#159c8e", fontWeight: 600 }}>{prepared.hashtags.join(" ")}</p>
            </div>
          </div>

          {/* 7. CTA & 8. Destination URL */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "#fafcfc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span className="field-label">7. CTA</span>
                <button
                  type="button"
                  onClick={() => copyText("cta", prepared.cta)}
                  className="text-button"
                  style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}
                >
                  {copiedKey === "cta" ? <Check size={12} color="#159c8e" /> : <Copy size={12} />}
                  {copiedKey === "cta" ? "Copied!" : "Copy CTA"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#2a4345" }}>{prepared.cta}</p>
            </div>

            <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--line)", background: "#fafcfc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span className="field-label">8. Destination URL</span>
                <button
                  type="button"
                  onClick={() => copyText("url", prepared.destinationUrl)}
                  className="text-button"
                  style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}
                >
                  {copiedKey === "url" ? <Check size={12} color="#159c8e" /> : <Copy size={12} />}
                  {copiedKey === "url" ? "Copied!" : "Copy URL"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#168f83", wordBreak: "break-all" }}>
                {prepared.destinationUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleOpenPlatform}
            className="primary-button"
            style={{
              padding: "10px 20px",
              background: "#2f54eb",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ExternalLink size={15} /> [Open {platformName}]
          </button>

          {status !== "USER_CONFIRMED" ? (
            <div style={{ display: "flex", gap: 8 }}>
              {!showConfirmInput ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmInput(true)}
                  className="primary-button"
                  style={{ background: "#159c8e" }}
                >
                  <Check size={15} /> Confirm Publication Done
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    placeholder="Enter live post URL (optional)..."
                    value={confirmedUrl}
                    onChange={(e) => setConfirmedUrl(e.target.value)}
                    style={{
                      height: 36,
                      fontSize: 11,
                      padding: "0 8px",
                      borderRadius: 6,
                      border: "1px solid var(--line)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleConfirmPublication}
                    className="primary-button"
                    style={{ padding: "0 14px", height: 36, fontSize: 11 }}
                  >
                    Save Confirmed
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#159c8e", fontWeight: 700, fontSize: 12 }}>
              <CheckCircle2 size={16} /> User Confirmed Published
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
