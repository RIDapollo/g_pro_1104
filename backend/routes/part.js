const express = require('express');
const router = express.Router();
const Part = require('../models/Part');

// GET /api/parts (모든 부품 목록 조회)
router.get('/', async (req, res) => {
  try {
    const parts = await Part.find({}).sort({ createdAt: -1 });
    res.status(200).json({ parts });
  } catch (error) {
    console.error("부품 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류로 부품 목록을 가져오지 못했습니다." });
  }
});

// POST /api/parts/register (기존 코드)
router.post('/register', async (req, res) => {
  try {
    const { partId, year, manufacturer, registrationDate, qrCode } = req.body;
    const newPart = new Part({ partId, year, manufacturer, registrationDate, qrCode });
    await newPart.save();
    res.status(201).json({ message: '부품이 성공적으로 등록되었습니다.' });
  } catch (error) {
    console.error('부품 등록 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류로 인해 부품 등록에 실패했습니다.' });
  }
});

// DELETE /api/parts/delete (부품 삭제)
router.delete('/delete', async (req, res) => {
  try {
    const { partId } = req.body;
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