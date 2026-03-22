import "./config/loadEnv.js"
import express from "express"
import dns from "dns"
import helmet from "helmet"
import cors from "cors"

import connectDB from "./config/db.js"
import "./config/redis.js"

import authRoutes from "./routes/authroutes.js"
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

app.use((req, res, next) => {
  res.status(404)
  next(new Error("Not found"))
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
