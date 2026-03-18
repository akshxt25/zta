import crypto from "crypto"

const otpStore = new Map()

export const generateOTP = (userId, context) => {

 const otp = crypto.randomInt(100000, 999999).toString()
 const sessionId = crypto.randomUUID()

 otpStore.set(sessionId, {
  userId,
  otp,
  context,
  attempts: 0,
  expiresAt: Date.now() + 5 * 60 * 1000 
 })

 console.log("Generated OTP:", otp)
 console.log("Session ID:", sessionId)

 return { otp, sessionId }
}

export const verifyOTP = (sessionId, inputOtp) => {

 const record = otpStore.get(sessionId)

 if (!record) {
  return { valid: false, message: "Session not found" }
 }

 if (Date.now() > record.expiresAt) {
  otpStore.delete(sessionId)
  return { valid: false, message: "OTP expired" }
 }

 record.attempts += 1

 if (record.attempts > 5) {
  otpStore.delete(sessionId)
  return { valid: false, message: "Too many attempts" }
 }

 if (record.otp === inputOtp) {

  otpStore.delete(sessionId)

  return {
   valid: true,
   userId: record.userId,
   context: record.context
  }

 }

 return { valid: false, message: "Invalid OTP" }
}