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

  return {
    ip,
    location: geo ? geo.country : null,
    device,
    deviceMeta: `${browser}-${os}`,
    loginHour: hour
  }
}

export default collectContext
