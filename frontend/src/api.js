// C:\bc_vehicle\frontend\src\api.js

import axios from "axios";

// ✅ 하드코딩된 Render 백엔드 URL
const API_URL = "https://g-pro-1104-backend.onrender.com";

axios.defaults.baseURL = API_URL;

export default axios;
