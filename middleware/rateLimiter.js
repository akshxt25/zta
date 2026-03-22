import rateLimit from "express-rate-limit"

const clientKey = (req) => req.ip || req.socket?.remoteAddress || "unknown"

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
