import geoip from "geoip-lite"
import {UAParser} from "ua-parser-js"

const collectContext = (req) => {

 const ip = req.ip || req.connection.remoteAddress

 const geo = geoip.lookup(ip)

 const parser = new UAParser(req.headers["user-agent"])

 const browser = parser.getBrowser().name || "Unknown"
 const os = parser.getOS().name || "Unknown"

 const device = `${browser}-${os}`

 const hour = new Date().getHours()

 return {
  ip,
  location: geo ? geo.country : null,
  device,
  loginHour: hour
 }

}

export default collectContext