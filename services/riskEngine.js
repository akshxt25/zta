import { LoginLog } from "../models/loginlog.js"

const DAY_MS = 24 * 60 * 60 * 1000

function circularMinuteDiff(a, b) {
  const diff = Math.abs(a - b)
  return Math.min(diff, 1440 - diff)
}

function median(nums) {
  if (!nums?.length) return null
  const sorted = [...nums].sort((x, y) => x - y)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2
  return sorted[mid]
}

const calculateRisk = async (context, user) => {
  let risk = 0
  let reasons = []

  if (context.location && context.location !== "IN") {
    risk += 0.3
    reasons.push("Foreign location")
  }

  const isTrusted = user.trustedDevices.some(
    (d) => d.deviceId === context.device
  )

  if (!isTrusted) {
    risk += 0.25
    reasons.push("New device")
  }

  // Time-based rule:
  // Use the first login time (earliest timestamp) for each of the last 5 days,
  // then compare today’s login time (±30 minutes).
  if (typeof context.loginMinutes === "number") {
    const since = new Date(Date.now() - 5 * DAY_MS)
    const logs = await LoginLog.find({
      userId: user._id,
      timestamp: { $gte: since }
    })
      .select("timestamp")
      .sort({ timestamp: 1 })
      .limit(500)

    // Map UTC+server-local day => first login minutes since midnight.
    const firstByDay = new Map() // dayKey => minutes
    for (const l of logs) {
      const ts = new Date(l.timestamp)
      const dayKey = `${ts.getFullYear()}-${ts.getMonth() + 1}-${ts.getDate()}`
      if (firstByDay.has(dayKey)) continue
      firstByDay.set(dayKey, ts.getHours() * 60 + ts.getMinutes())
    }

    const minutes = Array.from(firstByDay.values())
    // Require enough history so a new user doesn't get locked into MFA.
    if (minutes.length >= 3) {
      const expected = median(minutes)
      const current = context.loginMinutes
      const delta = circularMinuteDiff(current, expected)

      if (delta > 30) {
        risk += 0.3
        reasons.push("Login time deviates from last 5 days pattern")
      }
    }
  }

  if (context.ip && context.ip.startsWith("185.")) {
    risk += 0.5
    reasons.push("Suspicious IP")
  }

  const logs = await LoginLog.find({ userId: user._id }).limit(10)

  if (logs.length > 0) {
    const avgHour =
      logs.reduce(
        (acc, l) => acc + new Date(l.timestamp).getHours(),
        0
      ) / logs.length

    const deviation = Math.abs(avgHour - context.loginHour)

    if (deviation > 6) {
      risk += 0.25
      reasons.push("Behavior anomaly")
    }
  }

  // If login time is the main factor, always step-up (MFA_REQUIRED) rather than deny.
  // This matches: "more than 30 minutes deviation => require MFA".
  if (reasons.includes("Login time deviates from last 5 days pattern")) {
    risk = Math.min(risk, 0.69)
  }

  return { score: risk, reasons }
}

export default calculateRisk