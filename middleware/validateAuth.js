const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message })

export const validateRegister = (req, res, next) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return badRequest(res, "Email and password are required")
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return badRequest(res, "Invalid email format")
  }
  if (String(password).length < 8) {
    return badRequest(res, "Password must be at least 8 characters")
  }
  next()
}

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return badRequest(res, "Email and password are required")
  }
  next()
}

export const validateVerifyOtp = (req, res, next) => {
  const { sessionId, otp } = req.body || {}
  if (!sessionId || otp === undefined || otp === null) {
    return badRequest(res, "sessionId and otp are required")
  }
  if (!UUID_RE.test(String(sessionId).trim())) {
    return badRequest(res, "Invalid sessionId")
  }
  const otpStr = String(otp).trim()
  if (!/^\d{6}$/.test(otpStr)) {
    return badRequest(res, "OTP must be 6 digits")
  }
  next()
}

export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) {
    return badRequest(res, "currentPassword and newPassword are required")
  }
  if (String(newPassword).length < 8) {
    return badRequest(res, "New password must be at least 8 characters")
  }
  next()
}

export const validateLogout = (req, res, next) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken || typeof refreshToken !== "string") {
    return badRequest(res, "refreshToken is required")
  }
  next()
}

export const validateRefresh = validateLogout
