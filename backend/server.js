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

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/vehicles", vehicleRoutes); 
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/customers", customerRoutes); 

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));
});

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});