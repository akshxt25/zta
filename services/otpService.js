import crypto from "crypto"
import redis from "../config/redis.js"

const OTP_EXPIRY = 300
const MAX_ATTEMPTS = 5

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp).trim(), "utf8").digest("hex")
}

export const generateOTP = async (userId, context, { riskScore = null, reasons = [] } = {}) => {
  const otp = crypto.randomInt(100000, 999999).toString()
  const sessionId = crypto.randomUUID()
  const otpHash = hashOtp(otp)

  const data = {
    userId,
    otpHash,
    context,
    riskScore,
    reasons,
    attempts: 0
  }

  await redis.set(
    `otp:${sessionId}`,
    JSON.stringify(data),
    "EX",
    OTP_EXPIRY
  )

  return { otp, sessionId }
}

export const verifyOTP = async (sessionId, inputOtp) => {
  const key = `otp:${sessionId}`

  const recordStr = await redis.get(key)

  if (!recordStr) {
    return { valid: false, message: "Session expired or not found" }
  }

  const record = JSON.parse(recordStr)

  if (record.attempts >= MAX_ATTEMPTS) {
    await redis.del(key)
    return { valid: false, message: "Too many attempts" }
  }

  record.attempts += 1

  const inputHash = hashOtp(inputOtp)
  const expected = Buffer.from(record.otpHash, "hex")
  const actual = Buffer.from(inputHash, "hex")

  if (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  ) {
    await redis.del(key)

    return {
      valid: true,
      userId: record.userId,
      context: record.context,
      riskScore: record.riskScore ?? null,
      reasons: record.reasons ?? []
    }
  }

  await redis.set(key, JSON.stringify(record), "KEEPTTL")

  return { valid: false, message: "Invalid OTP" }
}
