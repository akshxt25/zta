import "./config/loadEnv.js"
import express from "express"
import http from "http"
import dns from "dns"
import helmet from "helmet"
import cors from "cors"
import jwt from "jsonwebtoken"
import { WebSocketServer } from "ws"

import connectDB from "./config/db.js"
import "./config/redis.js"
import { JWT_SECRET } from "./config/jwt.js"
import {
  addSocketForUser,
  removeSocket,
  broadcastToAll
} from "./realtime/wsHub.js"
import { deleteAllSessionsForAllUsers } from "./services/sessionStore.js"

import authRoutes from "./routes/authroutes.js"
import adminRoutes from "./routes/adminroutes.js"
import { errorHandler } from "./middleware/errorMiddleware.js"
import { blockBlacklistedIP } from "./middleware/ipBlocker.js"

dns.setServers(["8.8.8.8", "1.1.1.1"])

const app = express()

const trustHops = parseInt(process.env.TRUST_PROXY_HOPS ?? "0", 10)
if (!Number.isNaN(trustHops) && trustHops > 0) {
  app.set("trust proxy", trustHops)
}

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : true,
    credentials: true
  })
)
app.use(express.json({ limit: "64kb" }))

connectDB()

app.use(blockBlacklistedIP)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)

app.use((req, res, next) => {
  res.status(404)
  next(new Error("Not found"))
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = http.createServer(app)

const wss = new WebSocketServer({ server, path: "/ws" })

wss.on("connection", (ws, req) => {
  try {
    const url = new URL(req.url, "http://localhost")
    const token = url.searchParams.get("token")

    if (!token) {
      ws.close()
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded?.id
    const role = decoded?.role

    addSocketForUser({ userId, role, ws })

    ws.on("close", () => {
      removeSocket(ws)
    })
  } catch {
    try {
      ws.close()
    } catch {
      // ignore
    }
  }
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Force logout every 30 minutes (refresh-token session eviction).
// This keeps “demo” sessions from staying valid indefinitely.
const AUTO_LOGOUT_MS = 30 * 60 * 1000

setInterval(async () => {
  try {
    await deleteAllSessionsForAllUsers()
    broadcastToAll({
      type: "force_logout",
      payload: { reason: "auto_logout_30m", timestamp: new Date().toISOString() }
    })
  } catch (err) {
    console.error("Auto logout failed:", err?.message || err)
  }
}, AUTO_LOGOUT_MS).unref()
