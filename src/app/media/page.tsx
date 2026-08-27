import AppShell from "@/components/app-shell";
import MediaLibrary from "@/components/media-library";

export default function MediaPage() {
  return (
    <AppShell
      active="Media Library"
      title="Media Library"
      eyebrow="ASSET WORKSPACE"
      description="Upload, preview, and organize your photos and videos for automated publishing."
      showBack={true}
    >
      <MediaLibrary />
    </AppShell>
  );
}