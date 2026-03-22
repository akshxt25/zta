import mongoose from "mongoose"
import { User } from "../models/user.js"
import { LoginLog } from "../models/loginlog.js"
import { Blacklist } from "../models/blacklist.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const DAY_MS = 24 * 60 * 60 * 1000

const isValidIp = (s) => {
  if (typeof s !== "string" || !s.trim()) return false
  const v = s.trim()
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) {
    const parts = v.split(".").map(Number)
    return parts.every((n) => n >= 0 && n <= 255)
  }
  // IPv6 (simplified — allow common forms)
  if (v.includes(":")) return v.length <= 45
  return false
}

export const getOverviewStats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - DAY_MS)

  const [
    totalUsers,
    adminCount,
    logins24h,
    denied24h,
    mfaChallenges24h,
    avgRiskAgg
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "admin" }),
    LoginLog.countDocuments({ timestamp: { $gte: since } }),
    LoginLog.countDocuments({ timestamp: { $gte: since }, decision: "DENY" }),
    LoginLog.countDocuments({ timestamp: { $gte: since }, decision: "MFA_REQUIRED" }),
    LoginLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: null, avg: { $avg: "$riskScore" } } }
    ])
  ])

  const avgRisk =
    avgRiskAgg[0]?.avg != null ? Math.round(avgRiskAgg[0].avg * 1000) / 1000 : null

  res.json({
    totalUsers,
    adminCount,
    logins24h,
    denied24h,
    mfaChallenges24h,
    avgRiskLast24h: avgRisk
  })
})

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20))
  const search = typeof req.query.search === "string" ? req.query.search.trim() : ""

  const filter = {}
  if (search) {
    filter.email = { $regex: escapeRegex(search), $options: "i" }
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("email role createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ])

  res.json({
    items: items.map((u) => ({
      id: u._id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1
  })
})

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { role } = req.body || {}

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error("Invalid user id")
  }
  if (role !== "user" && role !== "admin") {
    res.status(400)
    throw new Error('role must be "user" or "admin"')
  }

  const target = await User.findById(id)
  if (!target) {
    res.status(404)
    throw new Error("User not found")
  }

  if (target.role === "admin" && role === "user") {
    const adminCount = await User.countDocuments({ role: "admin" })
    if (adminCount <= 1) {
      res.status(400)
      throw new Error("Cannot demote the last admin")
    }
  }

  target.role = role
  await target.save()

  res.json({
    id: target._id,
    email: target.email,
    role: target.role
  })
})

export const listAllLoginLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "25"), 10) || 25))
  const decision =
    typeof req.query.decision === "string" && req.query.decision.trim()
      ? req.query.decision.trim()
      : null

  const filter = {}
  if (decision && ["ALLOW", "DENY", "MFA_REQUIRED"].includes(decision)) {
    filter.decision = decision
  }

  const [items, total] = await Promise.all([
    LoginLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "email")
      .lean(),
    LoginLog.countDocuments(filter)
  ])

  res.json({
    items: items.map((log) => ({
      id: log._id,
      userId: log.userId?._id ?? log.userId,
      userEmail: log.userId?.email ?? null,
      ip: log.ip,
      location: log.location,
      device: log.device,
      riskScore: log.riskScore,
      decision: log.decision,
      reasons: log.reasons,
      timestamp: log.timestamp
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1
  })
})

export const listBlacklist = asyncHandler(async (req, res) => {
  const entries = await Blacklist.find().sort({ createdAt: -1 }).lean()
  res.json({
    items: entries.map((e) => ({
      id: e._id,
      ip: e.ip,
      reason: e.reason,
      createdAt: e.createdAt
    }))
  })
})

export const addBlacklistEntry = asyncHandler(async (req, res) => {
  const { ip, reason } = req.body || {}
  if (!isValidIp(ip)) {
    res.status(400)
    throw new Error("Invalid IP address")
  }
  const normalized = String(ip).trim()

  try {
    const doc = await Blacklist.create({
      ip: normalized,
      reason: reason ? String(reason).slice(0, 500) : ""
    })
    res.status(201).json({
      id: doc._id,
      ip: doc.ip,
      reason: doc.reason,
      createdAt: doc.createdAt
    })
  } catch (err) {
    if (err.code === 11000) {
      res.status(400)
      throw new Error("IP already blocked")
    }
    throw err
  }
})

export const removeBlacklistEntry = asyncHandler(async (req, res) => {
  const ip = typeof req.query.ip === "string" ? req.query.ip.trim() : ""
  if (!isValidIp(ip)) {
    res.status(400)
    throw new Error("Invalid IP address")
  }

  const result = await Blacklist.deleteOne({ ip })
  if (result.deletedCount === 0) {
    res.status(404)
    throw new Error("IP not found in blocklist")
  }

  res.json({ message: "Removed" })
})
