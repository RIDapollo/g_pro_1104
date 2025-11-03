const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require('../middleware/auth'); // 인증 미들웨어

// GET /api/users/check-id?username=... (ID 중복 확인)
router.get("/check-id", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "username required" });
    }
    const exists = await User.findOne({ username }).lean();
    return res.json({ available: !exists });
  } catch (err) {
    console.error('ID 중복 확인 오류:', err.message);
    res.status(500).json({ message: "server error", error: err.message });
  }
});

// POST /api/users/register (회원가입)
router.post("/register", async (req, res) => {
  try {
    const { username, password, walletAddress, role } = req.body;
    if (!username || !password || !walletAddress) {
      return res.status(400).json({ message: "username/password/walletAddress required" });
    }

    const dupUser = await User.findOne({ username });
    if (dupUser) return res.status(409).json({ message: "Username already exists" });

    const dupWallet = await User.findOne({ walletAddress });
    if (dupWallet) return res.status(409).json({ message: "Wallet address already exists" });

    const user = new User({ username, password, walletAddress, role });
    await user.save();

    return res.status(201).json({
      message: "Registered",
      user: { username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('회원가입 오류:', err.message);
    return res.status(500).json({ message: "server error", error: err.message });
  }
});

// POST /api/users/login (로그인)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "username/password required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // --- 🔽 디버깅 로그 추가 🔽 ---
    console.log("---------------------------------");
    console.log("토큰 발급(Signing)에 사용할 JWT_SECRET:", process.env.JWT_SECRET.trim());
    console.log("---------------------------------");
    // --- 🔼 디버깅 로그 추가 🔼 ---

    const token = jwt.sign(
      { 
        sub: user._id, 
        username: user.username, 
        role: user.role,
        walletAddress: user.walletAddress 
      },
      process.env.JWT_SECRET.trim(), // 공백 제거 적용
      { expiresIn: "2h" }
    );

    return res.json({ message: "Logged in", role: user.role, token });
  } catch (err) {
    console.error('로그인 중 오류 발생:', err);
    return res.status(500).json({ message: "server error", error: err.message });
  }
});

// GET /api/users/find?username=... (고객 검색)
// (authMiddleware 추가: 로그인한 사용자만 검색 가능)
router.get("/find", authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "검색할 사용자 이름이 필요합니다." });
    }
    // 일반 사용자(role: "user")만 검색하도록 제한
    const user = await User.findOne({ username: username, role: "user" }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "해당 ID의 고객을 찾을 수 없습니다." });
    }
    res.status(200).json({ user: user });
  } catch (error) {
    console.error('고객 검색 중 오류 발생:', error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// POST /api/users/change-password (비밀번호 변경)
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: "현재 비밀번호가 일치하지 않습니다." });
        }

        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
    } catch (error) {
        console.error('비밀번호 변경 중 오류 발생:', error);
        res.status(500).json({ message: "서버 오류가 발생했습니다.", error: error.message });
    }
});

// DELETE /api/users/withdraw (회원 탈퇴)
router.delete('/withdraw', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        // TODO: 관련된 Customer, Vehicle, Maintenance 데이터도 함께 삭제하는 로직이 필요할 수 있습니다.
        res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
    } catch (error) {
        console.error('회원 탈퇴 중 오류 발생:', error);
        res.status(500).json({ message: "서버 오류가 발생했습니다.", error: error.message });
    }
});

module.exports = router;

