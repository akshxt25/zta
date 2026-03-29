import mongoose from "mongoose"

const trustedDeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String
  },
  lastUsed: {
    type: Date
  }
})

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    trustedDevices: [trustedDeviceSchema]
  },
  { timestamps: true }
)

userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: "admin" } }
);

export const User = mongoose.model("User", userSchema)