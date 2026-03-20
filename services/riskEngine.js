import { locationRisk } from "./risk/locationRisk.js"
import { deviceRisk } from "./risk/deviceRisk.js"
import { timeRisk } from "./risk/timeRisk.js"
import { ipRisk } from "./risk/ipRisk.js"
import { behaviorRisk } from "./risk/behaviorRisk.js"
import { LoginLog } from "../models/loginLog.js"

const calculateRisk = async (context, user) => {
  let total = 0
  let reasons = []

  const pastLogs = await LoginLog.find({ userId: user._id }).limit(10)

  const checks = [
    locationRisk(context),
    deviceRisk(context, user),
    timeRisk(context),
    ipRisk(context),
    behaviorRisk(context, pastLogs)
  ]

  checks.forEach((c) => {
    total += c.score
    if (c.reason) reasons.push(c.reason)
  })

  return { score: total, reasons }
}

export default calculateRisk