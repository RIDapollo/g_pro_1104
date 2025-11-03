const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "bc_vehicle" });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("MongoDB 연결 오류:", err.message);
    process.exit(1); // 연결 실패 시 프로세스 종료
  }
}

module.exports = connectDB;
