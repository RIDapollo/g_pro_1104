const express = require('express');
const router = express.Router();
const { ethers } = require("ethers");
const Maintenance = require('../models/Maintenance');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const authMiddleware = require('../middleware/auth'); // ✅ 인증 미들웨어
require('dotenv').config();

// --- Ethers.js 설정 ---
const CONTRACT_ADDRESS = process.env.VEHICLE_INFO_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_URL = process.env.SEPOLIA_URL;

// ✅ 컨트랙트 ABI (일련번호 포함)
const CONTRACT_ABI = [
  "function addMaintenance(string memory _vehicleNumber, string memory _description, string memory _serialNumber) public",
  "function updateOdometer(string memory _vehicleNumber, uint256 _newOdometer) public",
  "function grantPermission(address _owner, address _requester, string memory _vehicleNumber) public",
  "function getMaintenanceCount(string memory _vehicleNumber) public view returns (uint256)",
  "function getMaintenanceRecord(string memory _vehicleNumber, uint256 index) public view returns (string memory description, uint256 timestamp, string memory serialNumber)"
];

// 컨트랙트 인스턴스 초기화
let vehicleContract;
if (CONTRACT_ADDRESS && PRIVATE_KEY && SEPOLIA_URL) {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    vehicleContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
} else {
    console.warn("⚠️ 경고: 정비 라우터의 블록체인 환경 변수가 누락되었습니다.");
}
// -----------------

// POST /api/maintenance/register (정비 이력 등록)
// ✅ authMiddleware 추가: 인증된 사용자(일반 사용자 또는 정비소)만 등록 가능
router.post('/register', authMiddleware, async (req, res) => {
  if (!vehicleContract) {
      return res.status(503).json({ message: '블록체인 서비스가 준비되지 않았습니다.' });
  }
  try {
    const { vehicleNumber, odometer, description, partInfo, walletAddress, requesterAddress } = req.body;
    
    
    const serialNumber = partInfo.serialNumber;
    if (!serialNumber) {
        return res.status(400).json({ message: "부품 일련번호(serialNumber)가 누락되었습니다." });
    }
    

    // 1. 블록체인에 정비 이력 추가 (일련번호 포함)
    const txMaintenance = await vehicleContract.addMaintenance(vehicleNumber, description, serialNumber);
    await txMaintenance.wait();
    console.log(`✅ 정비 이력 등록 트랜잭션 성공: ${txMaintenance.hash}`);

    // 2. 블록체인에 주행 거리 업데이트
    const txOdometer = await vehicleContract.updateOdometer(vehicleNumber, odometer);
    await txOdometer.wait();
    console.log(`✅ 주행거리 업데이트 트랜잭션 성공: ${txOdometer.hash}`);
    
    // 3. MongoDB에 정비 이력 저장
    const newMaintenance = new Maintenance({
      vehicleNumber,
      odometer,
      description,
      partInfo,
      walletAddress: walletAddress, // 소유주
      requesterAddress: requesterAddress || walletAddress, // 등록자
      timestamp: new Date().toISOString(),
      transactionHash: txMaintenance.hash 
    });
    await newMaintenance.save();
    
    res.status(201).json({ 
        message: '정비 이력이 성공적으로 등록되었습니다.',
        transactionHash: txMaintenance.hash
    });
  } catch (error) {
    console.error('정비 이력 등록 중 오류 발생:', error);
    res.status(500).json({ message: '정비 이력 등록 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

// GET /api/maintenance/history (일반 사용자용 정비 이력 조회)
// ✅ authMiddleware 추가: 인증된 사용자만 조회 가능
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { vehicleNumber } = req.query;
    if (!vehicleNumber) {
      return res.status(400).json({ message: '차량 번호가 필요합니다.' });
    }
    const maintenanceRecords = await Maintenance.find({ vehicleNumber }).sort({ timestamp: -1 });
    res.status(200).json({ history: maintenanceRecords });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
});

// GET /api/maintenance/shop-history (정비소 등록 이력 조회)
// ✅ authMiddleware 추가: 인증된 사용자(정비소)만 조회 가능
router.get('/shop-history', authMiddleware, async (req, res) => {
    try {
        const { requesterAddress } = req.query;
        if (!requesterAddress) {
            return res.status(400).json({ message: '요청자 지갑 주소가 필요합니다.' });
        }
        
        // 본인(정비소)의 이력만 조회하는지 확인
        if (req.user.walletAddress !== requesterAddress) {
            return res.status(403).json({ message: "권한이 없습니다." });
        }

        const historyRecords = await Maintenance.find({ requesterAddress: requesterAddress }).sort({ timestamp: -1 });
        res.status(200).json({ history: historyRecords });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
});


// POST /api/maintenance/request-permission (정비 권한 요청 - 정비소)
// ✅ authMiddleware 추가: 인증된 정비소만 요청 가능
router.post('/request-permission', authMiddleware, async (req, res) => {
  try {
    const { vehicleNumber, ownerAddress, requesterAddress } = req.body;

    // 요청자가 실제 정비소(register) 역할인지 확인
    if (req.user.role !== 'register' || req.user.walletAddress !== requesterAddress) {
        return res.status(403).json({ message: "정비소 계정으로만 요청할 수 있습니다." });
    }
    
    const existingRequest = await MaintenanceRequest.findOne({
      vehicleNumber,
      requesterAddress,
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(409).json({ message: '이미 보류 중인 요청이 있습니다.' });
    }

    const newRequest = new MaintenanceRequest({
      vehicleNumber,
      ownerAddress,
      requesterAddress,
      status: 'pending'
    });
    await newRequest.save();

    res.status(201).json({ message: '정비 권한 요청이 성공적으로 전송되었습니다.', request: newRequest });
  } catch (error) {
    console.error('권한 요청 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// POST /api/maintenance/permission-response (소유주 응답 처리 - 일반 사용자)
// ✅ authMiddleware 추가: 인증된 사용자만 응답 가능
router.post('/permission-response', authMiddleware, async (req, res) => {
  try {
    const { requestId, status, transactionHash: frontendTxHash } = req.body; 

    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
    }

    // ✅ 권한 확인: 요청의 소유주와 현재 로그인한 사용자가 일치하는지 확인
    if (request.ownerAddress !== req.user.walletAddress) {
        return res.status(403).json({ message: "요청의 소유주만 응답할 수 있습니다." });
    }

    request.status = status;
    await request.save();

    let transactionHash = null;
    if (status === 'approved') {
        transactionHash = frontendTxHash || 'FRONTEND_HANDLED_SUCCESSFULLY';
        console.log(`✅ MongoDB 업데이트 완료: 권한 승인 처리됨 (블록체인 트랜잭션 해시: ${transactionHash})`);
    }

    res.status(200).json({ 
        message: `요청이 성공적으로 ${status === 'approved' ? '승인' : '거부'}되었습니다.`, 
        request: request,
        transactionHash: transactionHash 
    });
  } catch (error) {
    console.error('권한 응답 처리 중 오류 발생:', error);
    res.status(500).json({ 
        message: '서버 오류가 발생했습니다. MongoDB 업데이트 실패 가능성.', 
        details: error.message 
    });
  }
});

// GET /api/maintenance/requests (권한 요청 목록 조회 - 일반 사용자)
// ✅ authMiddleware 추가: 인증된 사용자만 조회 가능
router.get('/requests', authMiddleware, async (req, res) => {
  try {
      const { ownerAddress } = req.query;
      if (!ownerAddress) {
          return res.status(400).json({ message: '소유주 지갑 주소가 필요합니다.' });
      }
      
      // ✅ 본인의 요청만 조회하는지 확인
      if (req.user.walletAddress !== ownerAddress) {
          return res.status(403).json({ message: "권한이 없습니다." });
      }

      const requests = await MaintenanceRequest.find({ ownerAddress, status: 'pending' });
      res.status(200).json({ requests: requests });
  } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/maintenance/authorized-vehicles (승인된 차량 목록 조회 - 정비소)
// ✅ authMiddleware 추가: 인증된 정비소만 조회 가능
router.get('/authorized-vehicles', authMiddleware, async (req, res) => {
    try {
        const { requesterAddress } = req.query;
        if (!requesterAddress) {
            return res.status(400).json({ message: '요청자 지갑 주소가 필요합니다.' });
        }
        
        // ✅ 본인(정비소)의 승인 내역만 조회하는지 확인
        if (req.user.role !== 'register' || req.user.walletAddress !== requesterAddress) {
             return res.status(403).json({ message: "권한이 없습니다." });
        }
        
        const approvedRequests = await MaintenanceRequest.find({ 
            requesterAddress, 
            status: 'approved' 
        });

        const authorizedVehicles = approvedRequests.map(req => ({
            vehicleNumber: req.vehicleNumber,
            ownerAddress: req.ownerAddress
        }));

        res.status(200).json({ vehicles: authorizedVehicles });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;

