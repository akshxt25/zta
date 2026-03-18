import mongoose from "mongoose";

const uri = "testi";

mongoose.connect(uri)
.then(() => {
    console.log("MongoDB Connected");
})
.catch(err => {
    console.error(err);
});