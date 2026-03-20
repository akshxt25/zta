import jwt from "jsonwebtoken"
import { JWT_SECRET, ACCESS_EXPIRES, REFRESH_EXPIRES } from "../config/jwt.js"

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  )
}

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  )
}