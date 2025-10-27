import axios from "axios";

// ✅ 1. 하드코딩된 Render 백엔드 URL
const API_URL = "https://g-pro-1104-backend.onrender.com";

// ✅ 2. 기본값(defaults)을 수정하는 대신, baseURL을 가진 새 인스턴스를 생성
const api = axios.create({
  baseURL: API_URL
});

// ✅ 3. 이 설정된 인스턴스를 export
export default api;
