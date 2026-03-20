import crypto from "crypto"

export const generateDeviceFingerprint = (req) => {
  const ua = req.headers["user-agent"] || ""
  const ip = req.ip || ""
  const raw = `${ua}-${ip}`
  return crypto.createHash("sha256").update(raw).digest("hex")
}