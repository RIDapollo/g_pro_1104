const express = require("express");
const cors = require("cors");
const connectDB = require("./db"); // DB 연결
require("dotenv").config();

// 라우터 임포트
const userRoutes = require("./routes/user");
const partRoutes = require("./routes/part");
const vehicleRoutes = require("./routes/vehicle"); 
const maintenanceRoutes = require("./routes/maintenance"); 
const customerRoutes = require("./routes/customer");

const app = express();

// 허용할 프론트엔드 주소 목록
const allowedOrigins = [
  "http://localhost:3000",      // 로컬 개발 환경
  "https://cse28.onrender.com"  // 배포된 프론트엔드
];

// CORS 설정
app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }, 
  credentials: true 
}));

// JSON 파싱 미들웨어
app.use(express.json());

// API 라우터 연결
app.use("/api/users", userRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/vehicles", vehicleRoutes); 
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/customers", customerRoutes); 

const PORT = process.env.PORT || 5000;

// DB 연결 및 서버 시작
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 API on port:${PORT}`));
}).catch(err => {
  console.error("MongoDB 연결 실패:", err);
  process.exit(1);
});

// 요청 로그 미들웨어 (모든 라우터 뒤에 위치해야 함)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // 다음 핸들러가 없으므로 next() 대신 404 응답 처리
  if (!res.headersSent) {
    // 404 핸들러로 사용 (정의된 API가 없을 경우)
    // res.status(404).json({ message: "API endpoint not found" });
  }
  next(); // 로그만 찍고 다음으로 넘기려면 이 줄을 유지
});
