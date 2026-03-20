import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    trustedDevices: [
      {
        deviceId: String,
        lastUsed: Date
      }
    ]
  },
  { timestamps: true }
)

export const User = mongoose.model("User", userSchema)