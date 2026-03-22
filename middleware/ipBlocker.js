import { Blacklist } from "../models/blacklist.js"
import { normalizeClientIp } from "../utils/ip.js"

export const blockBlacklistedIP = async (req, res, next) => {
  try {
    const ip = normalizeClientIp(req)

    const blocked = await Blacklist.findOne({ ip })

    if (blocked) {
      res.status(403)
      return next(new Error("Access blocked for this IP"))
    }

    next()
  } catch (err) {
    next(err)
  }
}
