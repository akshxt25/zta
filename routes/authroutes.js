import express from "express"
import {
  register,
  login,
  verifyOtpController,
  changePassword,
  logoutController,
  logoutAllDevices,
  getMe,
  refreshAccessToken,
  getMyLoginLogs
} from "../controllers/authController.js"

import { verifyToken } from "../middleware/authMiddleware.js"
import { loginLimiter, otpLimiter } from "../middleware/rateLimiter.js"
import {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateChangePassword,
  validateLogout,
  validateRefresh
} from "../middleware/validateAuth.js"

const router = express.Router()

router.post("/register", validateRegister, register)
router.post("/login", loginLimiter, validateLogin, login)
router.post("/verify-otp", otpLimiter, validateVerifyOtp, verifyOtpController)
router.post("/refresh", validateRefresh, refreshAccessToken)

router.get("/me", verifyToken, getMe)
router.get("/login-logs", verifyToken, getMyLoginLogs)

router.post(
  "/change-password",
  verifyToken,
  validateChangePassword,
  changePassword
)
router.post("/logout", verifyToken, validateLogout, logoutController)
router.post("/logout-all", verifyToken, logoutAllDevices)

export default router
