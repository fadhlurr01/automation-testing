import type { PlatformAdapter } from "@/lib/publishing/types";
import { InstagramAdapter } from "@/platforms/instagram/adapter";

export function getPlatformAdapter(platformSlug: string): PlatformAdapter | null {
  return platformSlug === "instagram" ? new InstagramAdapter() : null;
}

export class MockPlatformAdapter implements PlatformAdapter {
  constructor() { if (process.env.NODE_ENV === "production") throw new Error("Mock platform adapters are disabled in production."); }
  async publish(): Promise<never> { throw new Error("Mock publishing is opt-in for local tests and never reports a published result."); }
  async verify(): Promise<boolean> { return false; }
}
