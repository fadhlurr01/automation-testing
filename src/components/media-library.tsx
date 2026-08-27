"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Film, Image as ImageIcon, MoreHorizontal, Play, Search, Trash2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Asset = { id: string; file_name: string; mime_type: string; size_bytes: number; width: number | null; height: number | null; duration: number | null; storage_path: string; signedUrl: string | null; created_at: string };
const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const videoTypes = ["video/mp4", "video/quicktime"];
const formatSize = (bytes: number) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function MediaLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]); const [query, setQuery] = useState(""); const [filter, setFilter] = useState("all"); const [sort, setSort] = useState("newest"); const [selected, setSelected] = useState<string[]>([]); const [dragging, setDragging] = useState(false); const [progress, setProgress] = useState(0); const [status, setStatus] = useState(""); const [preview, setPreview] = useState<Asset | null>(null); const [renameId, setRenameId] = useState<string | null>(null); const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch("/api/media").then(async (response) => { if (response.ok) setAssets((await response.json()).assets); }); }, []);
  const visibleAssets = useMemo(() => assets.filter((asset) => (filter === "all" || asset.mime_type.startsWith(`${filter}/`)) && asset.file_name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "oldest" ? a.created_at.localeCompare(b.created_at) : a.file_name.localeCompare(b.file_name)), [assets, filter, query, sort]);
  function inspect(file: File) { return new Promise<{ width?: number; height?: number; duration?: number }>((resolve) => { if (file.type.startsWith("image/")) { const image = new window.Image(); image.onload = () => resolve({ width: image.width, height: image.height }); image.src = URL.createObjectURL(file); } else { const video = document.createElement("video"); video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration }); video.src = URL.createObjectURL(file); } }); }
  async function uploadFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (![...imageTypes, ...videoTypes].includes(file.type)) {
        setStatus(`${file.name}: tipe file tidak didukung.`);
        continue;
      }
      const max = file.type.startsWith("video/") ? 250 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > max) {
        setStatus(`${file.name}: ukuran maksimum adalah ${file.type.startsWith("video/") ? "250 MB" : "50 MB"}.`);
        continue;
      }

      try {
        setStatus(`Mengunggah ${file.name}...`);
        setProgress(30);

        const formData = new FormData();
        formData.append("file", file);

        setProgress(60);
        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Gagal mengunggah media.");

        setProgress(100);
        setAssets((current) => [result.asset, ...current]);
        setStatus(`✅ ${file.name} berhasil diunggah.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Upload gagal.");
      }
    }
    setTimeout(() => setProgress(0), 700);
  }
  async function remove(id: string) { if (!confirm("Delete this media asset?")) return; const response = await fetch("/api/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (response.ok) { setAssets((current) => current.filter((asset) => asset.id !== id)); setSelected((current) => current.filter((item) => item !== id)); } }
  async function rename(id: string) { if (!renameValue.trim()) return; const response = await fetch("/api/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, filename: renameValue.trim() }) }); if (response.ok) setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, file_name: renameValue.trim() } : asset)); setRenameId(null); }
  return <section className="media-library"><div className="media-toolbar"><div className="media-search"><Search size={17} /><input placeholder="Search media..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter media"><option value="all">All media</option><option value="image">Images</option><option value="video">Videos</option></select><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort media"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name</option></select><button className="primary-button" onClick={() => inputRef.current?.click()}><UploadCloud size={17} />Upload media</button><input ref={inputRef} type="file" hidden multiple accept={`${imageTypes.join(",")},${videoTypes.join(",")}`} onChange={(event) => event.target.files && uploadFiles(event.target.files)} /></div>
    <div className={`upload-dropzone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); uploadFiles(event.dataTransfer.files); }} onClick={() => inputRef.current?.click()}><UploadCloud size={25} /><div><b>Drop files here to upload</b><span>JPG, PNG, WEBP, GIF, MP4 or MOV · images up to 50 MB · video up to 250 MB</span></div></div>{progress > 0 && <div className="upload-progress"><span style={{ width: `${progress}%` }} /></div>}{status && <p className="media-status" role="status">{status}</p>}
    <div className="media-summary"><span><b>{visibleAssets.length}</b> assets</span>{selected.length > 0 && <span className="selection-count"><Check size={14} />{selected.length} selected</span>}</div><div className="media-grid">{visibleAssets.map((asset) => <article className={`media-card ${selected.includes(asset.id) ? "selected" : ""}`} key={asset.id}><button className="select-media" onClick={() => setSelected((current) => current.includes(asset.id) ? current.filter((id) => id !== asset.id) : [...current, asset.id])} aria-label={`Select ${asset.file_name}`}>{selected.includes(asset.id) && <Check size={13} />}</button><button className="media-preview" onClick={() => setPreview(asset)}>{asset.signedUrl && asset.mime_type.startsWith("image/") ? <Image src={asset.signedUrl} alt={asset.file_name} fill sizes="(max-width: 480px) 50vw, (max-width: 800px) 33vw, 25vw" unoptimized /> : <span className={asset.mime_type.startsWith("video/") ? "video-thumb" : "file-thumb"}>{asset.mime_type.startsWith("video/") ? <><Film size={27} /><Play size={13} /></> : <ImageIcon size={27} />}</span>}<span className="preview-overlay">Preview</span></button><div className="media-card-info"><div><b>{renameId === asset.id ? <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && rename(asset.id)} onBlur={() => rename(asset.id)} /> : asset.file_name}</b><small>{formatSize(asset.size_bytes)}{asset.width ? ` · ${asset.width}x${asset.height}` : ""}</small></div><button className="media-more" onClick={() => { setRenameId(asset.id); setRenameValue(asset.file_name); }} aria-label="Rename media"><MoreHorizontal size={17} /></button><button className="media-delete" onClick={() => remove(asset.id)} aria-label={`Delete ${asset.file_name}`}><Trash2 size={15} /></button></div></article>)}</div>{visibleAssets.length === 0 && <div className="media-empty"><UploadCloud size={25} /><h2>Your media library is empty</h2><p>Upload your first asset to start building content.</p></div>}
    {preview && <div className="preview-modal" role="dialog" aria-modal="true"><button className="preview-close" onClick={() => setPreview(null)} aria-label="Close preview"><X /></button><div className="preview-content">{preview.signedUrl && preview.mime_type.startsWith("image/") ? <Image src={preview.signedUrl} alt={preview.file_name} width={preview.width ?? 1200} height={preview.height ?? 800} unoptimized /> : preview.signedUrl && <video src={preview.signedUrl} controls autoPlay />}</div><div className="preview-meta"><b>{preview.file_name}</b><span>{formatSize(preview.size_bytes)} · {preview.mime_type}</span></div></div>}
  </section>;
}
