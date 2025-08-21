import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("Database connected"));
  await mongoose.connect(
    "mongodb+srv://beereshbc:beereshbc@backenddb.wcm3b.mongodb.net/luxoft"
  );
};

export default connectDB;
