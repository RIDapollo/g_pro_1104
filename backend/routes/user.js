const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // 대문자 U

// ID 중복 확인
// GET /api/users/check-id?username=abc
router.get("/check-id", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: "username required" });
  const exists = await User.findOne({ username }).lean();
  return res.json({ available: !exists });
});

// 회원가입
// POST /api/users/register  { username, password, walletAddress, role? }
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
    return res.status(500).json({ message: "server error", error: err.message });
  }
});

// 로그인
// POST /api/users/login  { username, password }
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "username/password required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { sub: user._id, username: user.username, role: user.role, walletAddress: user.walletAddress },
      process.env.JWT_SECRET.trim(),
      { expiresIn: "2h" }
    );

    return res.json({ message: "Logged in", role: user.role, token });
  } catch (err) {
    return res.status(500).json({ message: "server error", error: err.message });
  }
});

router.get("/find", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "검색할 사용자 이름이 필요합니다." });
    }

    // 'user' 역할을 가진 사용자만 검색
    const user = await User.findOne({ username: username, role: "user" }).select("-password"); // 보안을 위해 비밀번호 제외

    if (!user) {
      return res.status(404).json({ message: "해당 ID의 고객을 찾을 수 없습니다." });
    }

    res.status(200).json({
      message: "고객 정보를 성공적으로 찾았습니다.",
      user: user,
    });
  } catch (error) {
    console.error("고객 검색 중 오류 발생:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
