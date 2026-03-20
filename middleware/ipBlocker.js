import { Blacklist } from "../models/blackList.js"

export const blockBlacklistedIP = async (req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.ip

  const blocked = await Blacklist.findOne({ ip })

  if (blocked) {
    res.status(403)
    return next(new Error("Access blocked for this IP"))
  }

  next()
}