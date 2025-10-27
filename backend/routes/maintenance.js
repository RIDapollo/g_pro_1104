const express = require('express');
const router = express.Router();
const { ethers } = require("ethers");
const Maintenance = require('../models/Maintenance'); // MongoDB 모델
const MaintenanceRequest = require('../models/MaintenanceRequest'); // 권한 요청 모델
require('dotenv').config();

// 컨트랙트 정보 (MetaMask 연동을 위해 더 이상 서버에서 직접 사용하지 않음)
const CONTRACT_ADDRESS = process.env.VEHICLE_INFO_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// VehicleInfo.sol 컨트랙트의 ABI (필요한 함수만 포함)
const CONTRACT_ABI = [
  "function addMaintenance(string memory _vehicleNumber, string memory _description) public",
  "function updateOdometer(string memory _vehicleNumber, uint256 _newOdometer) public",
  "function grantPermission(address _owner, address _requester, string memory _vehicleNumber) public", // ABI 정의는 유지
  "function getMaintenanceCount(string memory _vehicleNumber) public view returns (uint256)",
  "function getMaintenanceRecord(string memory _vehicleNumber, uint256 index) public view returns (string memory description, uint256 timestamp)",
];

// 이더리움 공급자(Provider) 및 서명자(Signer) 설정 (다른 라우터/로직을 위해 유지)
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const vehicleContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// POST /api/maintenance/register (정비 이력 등록)
router.post('/register', async (req, res) => {
  try {
    const { vehicleNumber, odometer, description, partInfo, walletAddress } = req.body;
    console.log('정비 이력 등록 데이터 수신:', req.body);
    
    // 1. 블록체인에 정비 이력 추가
    const txMaintenance = await vehicleContract.addMaintenance(vehicleNumber, description);
    await txMaintenance.wait();

    // 2. 블록체인에 주행 거리 업데이트
    const txOdometer = await vehicleContract.updateOdometer(vehicleNumber, odometer);
    await txOdometer.wait();
    
    // 3. MongoDB에 정비 이력 저장
    const newMaintenance = new Maintenance({
      vehicleNumber,
      odometer,
      description,
      partInfo,
      walletAddress,
      timestamp: new Date().toISOString()
    });
    await newMaintenance.save();
    
    res.status(201).json({ message: '정비 이력이 성공적으로 등록되었습니다.' });
  } catch (error) {
    console.error('정비 이력 등록 중 오류 발생:', error);
    res.status(500).json({ message: '정비 이력 등록 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

// GET /api/maintenance/history (정비 이력 조회 - 일반 사용자용)
router.get('/history', async (req, res) => {
  try {
    const { vehicleNumber } = req.query;
    console.log(`차량 이력 조회 요청: ${vehicleNumber}`);

    if (!vehicleNumber) {
      return res.status(400).json({ message: '차량 번호가 필요합니다.' });
    }

    const maintenanceRecords = await Maintenance.find({ vehicleNumber }).sort({ timestamp: -1 });

    if (maintenanceRecords.length === 0) {
      return res.status(404).json({ message: '해당 차량의 정비 이력이 없습니다.' });
    }

    res.status(200).json({ 
      message: '정비 이력을 성공적으로 불러왔습니다.',
      history: maintenanceRecords
    });
  } catch (error) {
    console.error('정비 이력 조회 중 오류 발생:', error);
    res.status(500).json({ message: '정비 이력 조회 중 서버 오류가 발생했습니다.', error: error.message });
  }
});


// POST /api/maintenance/request-permission (정비 권한 요청 - 정비소)
router.post('/request-permission', async (req, res) => {
  try {
    const { vehicleNumber, ownerAddress, requesterAddress } = req.body;
    
    // 이미 보류 중인 요청이 있는지 확인
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
router.post('/permission-response', async (req, res) => {
  let transactionHash = null; 

  try {
    // 프론트엔드에서 블록체인 트랜잭션이 성공적으로 완료되었다고 가정합니다.
    const { requestId, status, transactionHash: frontendTxHash } = req.body; 

    // 1. 요청 상태 업데이트
    const request = await MaintenanceRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
    }

    // 2. 블록체인 호출 로직 제거 (프론트엔드에서 처리했으므로)
    if (status === 'approved') {
        transactionHash = frontendTxHash || 'FRONTEND_HANDLED_SUCCESSFULLY'; // 프론트에서 받은 해시를 저장
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
router.get('/requests', async (req, res) => {
  try {
      const { ownerAddress } = req.query;

      if (!ownerAddress) {
          return res.status(400).json({ message: '소유주 지갑 주소가 필요합니다.' });
      }

      const requests = await MaintenanceRequest.find({ ownerAddress, status: 'pending' });

      res.status(200).json({
          message: '정비 권한 요청 목록을 성공적으로 불러왔습니다.',
          requests: requests
      });
  } catch (error) {
      console.error('권한 요청 목록 조회 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/maintenance/shop-history (정비소 등록 이력 조회 - 정비소)
router.get('/shop-history', async (req, res) => {
    try {
        const { requesterAddress } = req.query;

        if (!requesterAddress) {
            return res.status(400).json({ message: '요청자 지갑 주소가 필요합니다.' });
        }
        
        const historyRecords = await Maintenance.find({ walletAddress: requesterAddress }).sort({ timestamp: -1 });

        if (historyRecords.length === 0) {
            return res.status(404).json({ message: '등록된 정비 이력이 없습니다.' });
        }

        res.status(200).json({ 
            message: '정비 이력을 성공적으로 불러왔습니다.',
            history: historyRecords
        });

    } catch (error) {
        console.error('정비소 이력 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// GET /api/maintenance/authorized-vehicles (승인된 차량 목록 조회 - 정비소)
router.get('/authorized-vehicles', async (req, res) => {
    try {
        const { requesterAddress } = req.query;

        if (!requesterAddress) {
            return res.status(400).json({ message: '요청자 지갑 주소가 필요합니다.' });
        }
        
        // MaintenanceRequest 테이블에서 'approved' 상태인 요청들을 조회
        const approvedRequests = await MaintenanceRequest.find({ 
            requesterAddress, 
            status: 'approved' 
        });

        // 결과 데이터를 차량 목록 형식으로 가공
        const authorizedVehicles = approvedRequests.map(req => ({
            vehicleNumber: req.vehicleNumber,
            ownerAddress: req.ownerAddress
        }));

        res.status(200).json({ 
            message: '승인된 차량 목록을 성공적으로 불러왔습니다.',
            vehicles: authorizedVehicles
        });

    } catch (error) {
        console.error('승인 차량 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

router.get('/authorized-vehicles', async (req, res) => {
    try {
        const { requesterAddress } = req.query;
        if (!requesterAddress) {
            return res.status(400).json({ message: '요청자 지갑 주소가 필요합니다.' });
        }
        
        // MaintenanceRequest 테이블에서 'approved' 상태인 요청들을 조회
        const approvedRequests = await MaintenanceRequest.find({ 
            requesterAddress, 
            status: 'approved' 
        });

        // 결과 데이터를 차량 목록 형식으로 가공
        const authorizedVehicles = approvedRequests.map(req => ({
            vehicleNumber: req.vehicleNumber,
            ownerAddress: req.ownerAddress
        }));

        res.status(200).json({ 
            message: '승인된 차량 목록을 성공적으로 불러왔습니다.',
            vehicles: authorizedVehicles
        });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;