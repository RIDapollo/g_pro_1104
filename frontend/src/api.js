<<<<<<< HEAD
// 아아악 시이발 왜 이렇게 로컬호스트로 보내는거야 시발

const API_URL = "https://g-pro-1104-backend.onrender.com";

export default API_URL;
=======
import axios from "axios";

// ✅ 여기에 배포된 Render 백엔드 URL을 직접 붙여넣으세요.
const API_URL = "https://g-pro-1104-backend.onrender.com"; // (실제 Render 주소로 변경)

axios.defaults.baseURL = API_URL;

// 로컬 테스트 시 참고:
// 로컬에서 백엔드 테스트가 필요할 경우, 위 URL을 "http://localhost:5000"으로
// 임시 변경하고 테스트한 뒤, GitHub에 푸시하기 전에 다시 Render URL로 돌려놓아야 합니다.

export default axios;
>>>>>>> parent of 742dd28 (Update api.js)
