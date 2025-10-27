// 아아악 시이발 왜 이렇게 로컬호스트로 보내는거야 시발

import axios from "axios";

// ✅ 하드코딩된 Render 백엔드 URL
const API_URL = "https://g-pro-1104-backend.onrender.com";

axios.defaults.baseURL = API_URL;

export default axios;
