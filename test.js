// import mongoose from "mongoose";

// const uri = "testi";

// mongoose.connect(uri)
// .then(() => {
//     console.log("MongoDB Connected");
// })
// .catch(err => {
//     console.error(err);
// });

import Redis from "ioredis"

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379
})

export default redis