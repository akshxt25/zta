import express from "express"
import { login , register, verifyOtpController } from "../controllers/authController.js"

const router = express.Router()

router.post("/login", login);
router.post("/register", register);
router.post("/verify-otp", verifyOtpController)


export default router;