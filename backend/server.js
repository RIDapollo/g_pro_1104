const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const userRoutes = require("./routes/user");
const partRoutes = require("./routes/part");
const vehicleRoutes = require("./routes/vehicle"); 
const maintenanceRoutes = require("./routes/maintenance"); 
const customerRoutes = require("./routes/customer");

require("dotenv").config();

const app = express();

// ✅ 1. 허용할 프론트엔드 주소 목록
const allowedOrigins = [
  "http://localhost:3000",      // 로컬 개발 환경
  "https://cse28.onrender.com"  // 배포된 프론트엔드
];

// ✅ 2. CORS 설정을 수정된 목록으로 적용
app.use(cors({ 
  origin: function (origin, callback) {
    // allowedOrigins에 포함되어 있거나, origin이 없는 경우(예: Postman) 허용
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }, 
  credentials: true 
}));

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/vehicles", vehicleRoutes); 
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/customers", customerRoutes); 

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // ✅ 3. 서버 실행 로그를 process.env.PORT로 통일 (localhost 고정 해제)
  app.listen(PORT, () => console.log(`🚀 API on port:${PORT}`));
});

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});