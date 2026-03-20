import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import authRoutes from "./routes/authroutes.js"
import redis from "./test.js"
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config()

const app = express()

app.use(express.json())

connectDB()

app.use("/api/auth", authRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`)
    try {
      await redis.set("test", "hello")
      const val = await redis.get("test")
      console.log("Redis test value:", val)
    } catch (err) {
      console.error("Redis connection failed:", err)
    }
  })