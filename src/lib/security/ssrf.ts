/**
 * SSRF (Server-Side Request Forgery) Protection Utility
 * Prevents requests to private, loopback, link-local, and cloud metadata IP ranges.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254", // AWS/GCP/Azure instance metadata
  "metadata.google.internal",
  "metadata.internal",
]);

export function isSafePublicUrl(urlString: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(urlString);

    // Only allow HTTP and HTTPS protocols
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { safe: false, reason: `Disallowed protocol: ${url.protocol}` };
    }

    const hostname = url.hostname.toLowerCase();

    // Check exact blocked hosts
    if (BLOCKED_HOSTS.has(hostname)) {
      return { safe: false, reason: `Restricted host target: ${hostname}` };
    }

    // Check IPv4 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const [, o1, o2] = match.map(Number);
      if (o1 === 10) return { safe: false, reason: "Private network IP range (10.0.0.0/8)" };
      if (o1 === 127) return { safe: false, reason: "Loopback IP range (127.0.0.0/8)" };
      if (o1 === 169 && o2 === 254) return { safe: false, reason: "Link-local IP range (169.254.0.0/16)" };
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return { safe: false, reason: "Private network IP range (172.16.0.0/12)" };
      if (o1 === 192 && o2 === 168) return { safe: false, reason: "Private network IP range (192.168.0.0/16)" };
      if (o1 === 0) return { safe: false, reason: "Zero network address" };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: "Malformed URL syntax" };
  }
}
