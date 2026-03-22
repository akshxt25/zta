import crypto from "crypto"
import { normalizeClientIp } from "./ip.js"

export const generateDeviceFingerprint = (req, clientIp) => {
  const ua = req.headers["user-agent"] || ""
  const ip = clientIp ?? normalizeClientIp(req)
  const raw = `${ua}-${ip}`

  return crypto.createHash("sha256").update(raw).digest("hex")
}
