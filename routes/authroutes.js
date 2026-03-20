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

const router = express.Router()

router.post("/register", register)
router.post("/login", loginLimiter, login)
router.post("/verify-otp", otpLimiter, verifyOtpController)

router.post("/change-password", verifyToken, changePassword)
router.post("/logout", verifyToken, logoutController)
router.post("/logout-all", verifyToken, logoutAllDevices)

export default router