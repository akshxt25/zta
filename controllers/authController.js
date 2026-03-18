import { User } from "../models/user.js";
import { LoginLog } from "../models/loginLog.js";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "../services/emailService.js";
import collectContext from "../services/contextCollector.js";
import calculateRisk from "../services/riskEngine.js";
import evaluatePolicy from "../services/policyEngine.js";
import { verifyOTP } from "../services/otpService.js";
import { generateOTP } from "../services/otpService.js";

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      trustedDevices: [],
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const context = collectContext(req);

    console.log("Detected Device:", context.device);
    console.log("Trusted Devices:", user.trustedDevices);

    const riskScore = calculateRisk(context, user);

    const decision = evaluatePolicy(riskScore);

    await LoginLog.create({
      userId: user._id,
      ip: context.ip,
      location: context.location,
      device: context.device,
      riskScore,
      decision,
    });

    if (decision === "MFA_REQUIRED") {
      const { otp, sessionId } = generateOTP(user._id.toString(), context);

      console.log("Generated OTP:", otp);

      await sendOTPEmail(user.email, otp);

      return res.json({
        decision,
        message: "OTP required",
        userId: user._id,
        sessionId: sessionId,
      });
    }

    if (decision === "DENY") {
      return res.status(403).json({
        decision,
        message: "Access denied due to high risk",
      });
    }

    if (decision === "ALLOW") {
      if (!user.trustedDevices.includes(context.device)) {
        user.trustedDevices.push(context.device);
        await user.save();

        console.log("Device added to trusted list");
      }

      return res.json({
        decision,
        message: "Login successful",
        riskScore,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyOtpController = async (req, res) => {
  try {
    const { sessionId, otp } = req.body;

    const result = verifyOTP(sessionId, otp);

    if (!result.valid) {
      return res.status(400).json({
        message: result.message,
      });
    }

    const user = await User.findById(result.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const context = result.context;

    if (!user.trustedDevices.includes(context.device)) {
      user.trustedDevices.push(context.device);
      await user.save();

      console.log("Device trusted after MFA:", context.device);
    }

    res.json({
      message: "MFA successful",
      access: "GRANTED",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
