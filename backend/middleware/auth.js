const jwt = require('jsonwebtoken');

// JWT 인증 미들웨어
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.split(' ')[1];

    console.log("---------------------------------");
    console.log("수신된 토큰:", token);
    console.log("검증에 사용할 JWT_SECRET:", process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ req.user에 walletAddress 포함
    req.user = { 
      id: decoded.sub, 
      username: decoded.username, 
      role: decoded.role,
      walletAddress: decoded.walletAddress 
    };
    
    next();

  } catch (error) {
    console.error('JWT 인증 오류:', error.message);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = authMiddleware;
