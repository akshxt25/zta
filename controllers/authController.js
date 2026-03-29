import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";
import { User } from "../models/user.js";
import { LoginLog } from "../models/loginlog.js";

import collectContext from "../services/contextCollector.js";
import calculateRisk from "../services/riskEngine.js";
import evaluatePolicy from "../services/policyEngine.js";

import { generateOTP, verifyOTP } from "../services/otpService.js";
import { sendOTPEmail } from "../services/emailService.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenService.js";

import {
  storeRefreshToken,
  deleteRefreshToken,
  deleteAllUserSessions,
  refreshTokenBelongsToUser,
  verifyRefreshToken,
} from "../services/sessionStore.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const AUTH_FAILED = "Invalid email or password";

export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashed,
    role: "user", // always user
  });

  res.status(201).json({ userId: user._id });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error(AUTH_FAILED);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401);
    throw new Error(AUTH_FAILED);
  }

  const context = collectContext(req);

  const now = new Date();
  user.trustedDevices = user.trustedDevices.filter((d) => {
    const diff = (now - new Date(d.lastUsed)) / (1000 * 60 * 60 * 24);
    return diff < 30;
  });
  await user.save();

  const { score, reasons } = await calculateRisk(context, user);
  const decision = evaluatePolicy(score);

  await LoginLog.create({
    userId: user._id,
    ip: context.ip,
    location: context.location,
    device: context.device,
    riskScore: score,
    decision,
    reasons,
  });

  if (decision === "DENY") {
    res.status(403);
    throw new Error("Access denied");
  }

  if (decision === "MFA_REQUIRED") {
    const { otp, sessionId } = await generateOTP(user._id.toString(), context);

    await sendOTPEmail(user.email, otp);

    return res.json({ decision, sessionId });
  }

  const existingDevice = user.trustedDevices.find(
    (d) => d.deviceId === context.device,
  );

  if (!existingDevice) {
    user.trustedDevices.push({
      deviceId: context.device,
      lastUsed: new Date(),
    });
  } else {
    existingDevice.lastUsed = new Date();
  }

  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await storeRefreshToken(user._id.toString(), refreshToken);

  res.json({ accessToken, refreshToken });
});

export const verifyOtpController = asyncHandler(async (req, res) => {
  const { sessionId, otp } = req.body;

  const result = await verifyOTP(sessionId, otp);

  if (!result.valid) {
    res.status(400);
    throw new Error(result.message);
  }

  const user = await User.findById(result.userId);

  const context = result.context;

  const existingDevice = user.trustedDevices.find(
    (d) => d.deviceId === context.device,
  );

  if (!existingDevice) {
    user.trustedDevices.push({
      deviceId: context.device,
      lastUsed: new Date(),
    });
  } else {
    existingDevice.lastUsed = new Date();
  }

  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await storeRefreshToken(user._id.toString(), refreshToken);

  res.json({ accessToken, refreshToken });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  const { currentPassword, newPassword } = req.body;

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    res.status(400);
    throw new Error("Incorrect password");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  await deleteAllUserSessions(user._id.toString());

  res.json({ message: "Password updated, sessions revoked" });
});

export const logoutController = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const ok = await refreshTokenBelongsToUser(refreshToken, req.user.id);
  if (!ok) {
    res.status(400);
    throw new Error("Invalid or expired refresh token");
  }

  await deleteRefreshToken(refreshToken);

  res.json({ message: "Logged out" });
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  await deleteAllUserSessions(req.user.id);
  res.json({ message: "Logged out from all devices" });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("email role createdAt");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({
    id: user._id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) {
    res.status(401);
    throw new Error("Invalid or expired refresh token");
  }

  try {
    jwt.verify(refreshToken, JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(401);
    throw new Error("User not found");
  }

  const accessToken = generateAccessToken(user);
  res.json({ accessToken });
});

export const getMyLoginLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));

  const logs = await LoginLog.find({ userId: req.user.id })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  res.json({
    items: logs.map((log) => ({
      id: log._id,
      ip: log.ip,
      location: log.location,
      device: log.device,
      riskScore: log.riskScore,
      decision: log.decision,
      reasons: log.reasons,
      timestamp: log.timestamp,
    })),
  });
});
