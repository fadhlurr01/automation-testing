import type { PlatformAdapter } from "@/lib/publishing/types";
import { InstagramAdapter } from "@/platforms/instagram/adapter";
import { PinterestAdapter } from "@/platforms/pinterest/adapter";
import { MediumAdapter } from "@/platforms/medium/adapter";
import { ImgboxAdapter } from "@/platforms/imgbox/adapter";

export function getPlatformAdapter(platformSlug: string): PlatformAdapter | null {
  switch (platformSlug.toLowerCase()) {
    case "instagram":
      return new InstagramAdapter();
    case "pinterest":
      return new PinterestAdapter();
    case "medium":
      return new MediumAdapter();
    case "imgbox":
      return new ImgboxAdapter();
    default:
      return null;
  }
}

export class MockPlatformAdapter implements PlatformAdapter {
  constructor() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Mock platform adapters are disabled in production.");
    }
  }
  async publish(): Promise<never> {
    throw new Error("Mock publishing is opt-in for local tests and never reports a published result.");
  }
  async verify(): Promise<boolean> {
    return false;
  }
}
