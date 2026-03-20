import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/jwt.js"

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    res.status(401)
    return next(new Error("No token provided"))
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401)
    next(new Error("Invalid token"))
  }
}