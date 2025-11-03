const express = require('express');
const router = express.Router();
const Part = require('../models/Part');
const authMiddleware = require('../middleware/auth'); // 인증 미들웨어 추가

// GET /api/parts (모든 부품 목록 조회)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 부품사만 조회 가능하도록 권한 설정 (선택 사항)
    // if (req.user.role !== 'company') {
    //   return res.status(403).json({ message: '권한이 없습니다.' });
    // }
    const parts = await Part.find({}).sort({ createdAt: -1 });
    res.status(200).json({ parts });
  } catch (error) {
    console.error("부품 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류로 부품 목록을 가져오지 못했습니다." });
  }
});

// POST /api/parts/register (부품 등록)
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { partId, year, manufacturer, registrationDate, serialNumber, qrCode } = req.body;
    
    // 부품사만 등록 가능하도록 권한 설정
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: '부품 등록 권한이 없습니다.' });
    }

    const newPart = new Part({ 
      partId, 
      year, 
      manufacturer, 
      registrationDate, 
      serialNumber, 
      qrCode 
    });
    
    await newPart.save();
    res.status(201).json({ message: '부품이 성공적으로 등록되었습니다.' });
  } catch (error) {
    console.error('부품 등록 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류로 인해 부품 등록에 실패했습니다.' });
  }
});

// DELETE /api/parts/delete (부품 삭제)
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const { partId } = req.body; // 프론트에서 _id를 partId로 보냄
    
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: '부품 삭제 권한이 없습니다.' });
    }

    if (!partId) {
      return res.status(400).json({ message: '삭제할 부품의 ID가 필요합니다.' });
    }

    const deletedPart = await Part.findByIdAndDelete(partId);
    if (!deletedPart) {
      return res.status(404).json({ message: '해당 부품을 찾을 수 없습니다.' });
    }
    res.status(200).json({ message: '부품이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('부품 삭제 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류로 인해 부품 삭제에 실패했습니다.' });
  }
});

module.exports = router;
