import mongoose from "mongoose";

async function connectDB(){
    try {
        const result = await mongoose.connect(process.env.MONGO_URI);
        console.log("DB connected");
    } catch (error) {
        console.log("Error in connecting DB : ", error);
    }
}

export default connectDB;