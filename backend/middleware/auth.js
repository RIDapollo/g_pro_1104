const jwt = require('jsonwebtoken');

// JWT 인증 미들웨어
const authMiddleware = (req, res, next) => {
  try {
    // 1. 요청 헤더에서 'Authorization' 값을 가져옵니다.
    // 형식: "Bearer [토큰 값]"
    const authHeader = req.headers.authorization;

    // 2. 헤더나 토큰이 없는 경우 401 오류 반환
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    // "Bearer " 부분을 제외한 순수 토큰 값만 추출
    const token = authHeader.split(' ')[1];

    // 3. 토큰 검증
    // .env 파일의 JWT_SECRET을 사용하여 토큰이 유효한지 확인합니다.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. 검증 성공 시, 요청 객체(req)에 사용자 정보 추가
    // decoded 페이로드에는 로그인 시 저장했던 정보(id, username, role)가 포함됩니다.
    req.user = { 
      id: decoded.sub, 
      username: decoded.username, 
      role: decoded.role,
      walletAddress: decoded.walletAddress
    };
    
    // 다음 미들웨어나 라우터 핸들러로 제어를 넘깁니다.
    next();

  } catch (error) {
    // 5. 토큰 검증 실패 시 (만료, 변조 등) 401 오류 반환
    console.error('JWT 인증 오류:', error.message);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = authMiddleware;