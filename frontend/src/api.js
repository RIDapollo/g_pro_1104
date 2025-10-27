// 아아악 시이발 왜 이렇게 로컬호스트로 보내는거야 시발

import axios from "axios";

// NODE_ENV는 Vercel이 'npm run build'를 실행할 때 자동으로 'production'이 됩니다.
const API_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL // Vercel 환경변수 (Render URL)
    : "http://localhost:5000";        // 로컬 개발 환경

axios.defaults.baseURL = API_URL;

export default axios;
