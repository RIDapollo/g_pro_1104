const express = require('express');
const router = express.Router();
const { ethers } = require("ethers");
const Vehicle = require('../models/Vehicle'); 
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
require('dotenv').config();

// =============================================
// ✅ Ethers.js 인스턴스화 방어 로직 추가
// =============================================
const CONTRACT_ADDRESS = process.env.VEHICLE_INFO_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_URL = process.env.SEPOLIA_URL;

// 컨트랙트 초기화가 필요한지 확인하는 플래그
let isContractReady = false;
let vehicleContract;
const CONTRACT_ABI = [
  "function registerVehicle(string memory _vehicleNumber, uint256 _year, string memory _manufacturer, uint256 _odometer) public",
];

// 서버 시작 시 컨트랙트를 초기화하고 준비 상태를 확인합니다.
if (CONTRACT_ADDRESS && PRIVATE_KEY && SEPOLIA_URL) {
    try {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        vehicleContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        isContractReady = true;
    } catch (e) {
        console.error("❌ Ethers 초기화 실패: 컨트랙트 주소/ABI/URL 확인 필요.", e);
    }
} else {
    console.warn("⚠️ 경고: 블록체인 환경 변수가 누락되어 컨트랙트 기능을 사용할 수 없습니다. (.env 확인)");
}
// =============================================

// POST /api/vehicles/register 요청을 처리
router.post('/register', async (req, res) => {
  if (!isContractReady) {
      return res.status(503).json({ message: '서버가 블록체인에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.' });
  }

  try {
    const { vehicleNumber, year, manufacturer, walletAddress } = req.body;

    // 1. 블록체인에 차량 정보 등록
    const tx = await vehicleContract.registerVehicle(
      vehicleNumber,
      year,
      manufacturer,
      0 // odometer 초기값 0 추가
    );
    await tx.wait();

    console.log(`✅ 차량 등록 트랜잭션이 성공적으로 완료되었습니다.
트랜잭션 해시: ${tx.hash}`);

    // 2. MongoDB에 차량 정보 저장
    const newVehicle = new Vehicle({
      vehicleNumber,
      year,
      manufacturer,
      walletAddress,
    });
    await newVehicle.save();

    res.status(201).json({
      message: '차량이 블록체인과 MongoDB에 성공적으로 등록되었습니다.',
      transactionHash: tx.hash
    });
  } catch (error) {
    console.error('차량 등록 중 오류 발생:', error);
    res.status(500).json({
      message: '차량 등록 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// GET /api/vehicles/info 요청을 처리 (지갑 주소 기반으로 여러 차량 정보 조회)
router.get('/info', async (req, res) => {
  // 블록체인 조회 기능은 MongoDB에 의존하므로, 블록체인 준비 상태를 필수로 확인하지는 않습니다.
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ message: '지갑 주소가 필요합니다.' });
    }

    const vehicles = await Vehicle.find({ walletAddress });

    if (vehicles.length === 0) {
      return res.status(404).json({ message: '해당 지갑 주소로 등록된 차량이 없습니다.' });
    }

    res.status(200).json({
      message: '차량 정보를 성공적으로 가져왔습니다.',
      vehicles: vehicles
    });
  } catch (error) {
    console.error('차량 정보 조회 중 오류 발생:', error);
    res.status(500).json({
      message: '차량 정보 조회 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// GET /api/vehicles/owner 요청을 처리 (차량 번호로 소유주 조회)
router.get('/owner', async (req, res) => {
  try {
    const { vehicleNumber } = req.query;
    if (!vehicleNumber) {
      return res.status(400).json({ message: '차량 번호가 필요합니다.' });
    }

    const vehicle = await Vehicle.findOne({ vehicleNumber });
    if (!vehicle) {
      return res.status(404).json({ message: '해당 차량 번호로 등록된 차량이 없습니다.' });
    }

    res.status(200).json({
      message: '차량 소유주 정보를 성공적으로 가져왔습니다.',
      ownerAddress: vehicle.walletAddress
    });
  } catch (error) {
    console.error('차량 소유주 조회 중 오류 발생:', error);
    res.status(500).json({
      message: '서버 오류가 발생했습니다.',
      details: error.message // 상세 오류 메시지 추가
    });
  }
});

router.get('/by-customer', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: '고객 ID가 필요합니다.' });
    }

    // 1. userId로 고객의 정보를 찾습니다.
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '해당 ID의 고객을 찾을 수 없습니다.' });
    }

    // 2. 고객의 walletAddress를 사용하여 차량 목록을 조회합니다.
    const vehicles = await Vehicle.find({ walletAddress: user.walletAddress });

    if (vehicles.length === 0) {
      return res.status(404).json({ message: '해당 고객에게 등록된 차량이 없습니다.' });
    }

    res.status(200).json({
      message: '고객의 차량 정보를 성공적으로 가져왔습니다.',
      vehicles: vehicles
    });
  } catch (error) {
    console.error('고객 차량 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const { vehicleId } = req.body; // 프론트엔드에서 vehicleId를 보냅니다.
    const user = req.user; // 인증 미들웨어에서 온 사용자 정보

    if (!vehicleId) {
      return res.status(400).json({ message: '삭제할 차량의 ID가 필요합니다.' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: '삭제할 차량을 찾을 수 없습니다.' });
    }

    // 권한 확인: 요청자가 차량 소유주이거나 정비소(register) 역할인지 확인
    if (vehicle.walletAddress !== user.walletAddress && user.role !== 'register') {
      return res.status(403).json({ message: '이 차량을 삭제할 권한이 없습니다.' });
    }
    
    await Vehicle.findByIdAndDelete(vehicleId);
    
    // TODO: 블록체인에서도 해당 차량 정보를 삭제하거나 비활성화하는 로직을 추가할 수 있습니다.
    
    res.status(200).json({ message: '차량이 성공적으로 삭제되었습니다.' });

  } catch (error) {
    console.error("차량 삭제 중 오류 발생:", error);
    res.status(500).json({ message: '서버 오류로 인해 차량 삭제에 실패했습니다.' });
  }
});


module.exports = router;