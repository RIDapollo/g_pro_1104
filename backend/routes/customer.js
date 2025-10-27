const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth'); // JWT 인증 미들웨어

// GET /api/customers (등록된 고객 목록 조회)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const registrarId = req.user.id; // 인증 미들웨어에서 추출한 등록자 ID

    const customers = await Customer.find({ registeredBy: registrarId }).populate('userId', 'username');

    res.status(200).json({
      message: '고객 목록을 성공적으로 불러왔습니다.',
      customers: customers.map(c => ({ _id: c._id, userId: c.userId._id, username: c.userId.username }))
    });
  } catch (error) {
    console.error('고객 목록 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// POST /api/customers/register (고객 등록 - 기존 코드)
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { userId, username } = req.body;
    const registeredById = req.user.id;

    const existingCustomer = await Customer.findOne({ userId, registeredBy: registeredById });
    if (existingCustomer) {
      return res.status(409).json({ message: '이미 등록된 고객입니다.' });
    }

    const newCustomer = new Customer({
      userId,
      username,
      registeredBy: registeredById,
    });
    
    await newCustomer.save();
    
    res.status(201).json({
      message: '고객이 성공적으로 등록되었습니다.',
      customer: newCustomer
    });

  } catch (error) {
    console.error('고객 등록 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류로 인해 고객 등록에 실패했습니다.' });
  }
});

// ✅ DELETE /api/customers/delete (고객 삭제) - 새로 추가
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.body;
    const registrarId = req.user.id;

    if (!customerId) {
      return res.status(400).json({ message: '삭제할 고객 ID가 필요합니다.' });
    }

    // 본인이 등록한 고객만 삭제할 수 있도록 권한 확인
    const customer = await Customer.findOneAndDelete({ 
        _id: customerId, 
        registeredBy: registrarId 
    });

    if (!customer) {
      return res.status(404).json({ message: '해당 고객을 찾을 수 없거나 삭제할 권한이 없습니다.' });
    }

    res.status(200).json({ message: '고객 정보가 성공적으로 삭제되었습니다.' });

  } catch (error) {
    console.error('고객 삭제 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류로 인해 고객 삭제에 실패했습니다.' });
  }
});

module.exports = router;