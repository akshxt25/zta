import geoip from "geoip-lite"
import { UAParser } from "ua-parser-js"
import { generateDeviceFingerprint } from "../utils/deviceFingerprint.js"
import { normalizeClientIp } from "../utils/ip.js"

const collectContext = (req) => {
  const ip = normalizeClientIp(req)

  const geo = geoip.lookup(ip)

  const parser = new UAParser(req.headers["user-agent"])

  const browser = parser.getBrowser().name || "Unknown"
  const os = parser.getOS().name || "Unknown"

  const device = generateDeviceFingerprint(req, ip)

  const hour = new Date().getHours()
  const minute = new Date().getMinutes()
  const loginMinutes = hour * 60 + minute

  return {
    ip,
    location: geo ? geo.country : null,
    device,
    deviceMeta: `${browser}-${os}`,
    loginHour: hour,
    loginMinutes
  }
}

export default collectContext
