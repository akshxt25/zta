import { LoginLog } from "../models/loginLog.js"

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

  if (context.loginHour < 3 || context.loginHour > 23) {
    risk += 0.2
    reasons.push("Unusual login time")
  }

  if (context.ip && context.ip.startsWith("185.")) {
    risk += 0.5
    reasons.push("Suspicious IP")
  }

  // behavioral check
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

  return { score: risk, reasons }
}

export default calculateRisk