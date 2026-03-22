import rateLimit, { ipKeyGenerator } from "express-rate-limit"

/** IPv6-safe key for rate limiting (see ERR_ERL_KEY_GEN_IPV6). */
const clientKey = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || "127.0.0.1"
  return ipKeyGenerator(typeof ip === "string" ? ip : String(ip))
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts, try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey
})

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Too many OTP attempts, try later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey
})
