import express from "express"
import {
  register,
  login,
  verifyOtpController,
  changePassword,
  logoutController,
  logoutAllDevices
} from "../controllers/authController.js"

import { verifyToken } from "../middleware/authMiddleware.js"
import { loginLimiter, otpLimiter } from "../middleware/rateLimiter.js"
import {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateChangePassword,
  validateLogout
} from "../middleware/validateAuth.js"

const router = express.Router()

router.post("/register", validateRegister, register)
router.post("/login", loginLimiter, validateLogin, login)
router.post("/verify-otp", otpLimiter, validateVerifyOtp, verifyOtpController)

router.post(
  "/change-password",
  verifyToken,
  validateChangePassword,
  changePassword
)
router.post("/logout", verifyToken, validateLogout, logoutController)
router.post("/logout-all", verifyToken, logoutAllDevices)

export default router
