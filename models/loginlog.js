import mongoose from "mongoose"

const loginLog = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
       },
      
       ip: String,
      
       location: String,
      
       device: String,
      
       riskScore: Number,
      
       decision: String,
      
       timestamp: {
        type: Date,
        default: Date.now
       }
})

export const LoginLog = mongoose.model("loginLog" , loginLog);