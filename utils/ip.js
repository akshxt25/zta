/**
 * Client IP after `trust proxy` is configured (see index.js).
 * Strips IPv4-mapped IPv6 prefix for geoip / consistent hashing.
 */
export function normalizeClientIp(req) {
  let ip =
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    ""

  if (typeof ip === "string" && ip.startsWith("::ffff:")) {
    ip = ip.slice(7)
  }

  return ip || "unknown"
}
