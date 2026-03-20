import crypto from "crypto"
import redis from "../config/redis.js"

const OTP_EXPIRY = 300
const MAX_ATTEMPTS = 5

export const generateOTP = async (userId, context) => {
  const otp = crypto.randomInt(100000, 999999).toString()
  const sessionId = crypto.randomUUID()

  const data = {
    userId,
    otp,
    context,
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

  if (record.otp === inputOtp) {
    await redis.del(key)

    return {
      valid: true,
      userId: record.userId,
      context: record.context
    }
  }

  await redis.set(key, JSON.stringify(record), "KEEPTTL")

  return { valid: false, message: "Invalid OTP" }
}