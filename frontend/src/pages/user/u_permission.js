import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import axios from '../../api';
import { ethers } from 'ethers';

// 컨트랙트 정보 (MetaMask 연동을 위해 사용)
const V_CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS; 
const V_CONTRACT_ABI = [
  "function grantPermission(address _owner, address _requester, string memory _vehicleNumber) public",
];


export default function UPermission() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        setMessage({ text: 'MetaMask를 설치해주세요.', type: 'error' });
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setWalletAddress(address);

      const response = await axios.get(`/api/maintenance/requests?ownerAddress=${address}`);
      const requests = response.data.requests;
      setPermissionRequests(requests);

      if (requests.length > 0) {
        setMessage({ text: `${requests.length}개의 정비 권한 요청이 있습니다.`, type: 'info' });
      } else {
        setMessage({ text: '새로운 정비 권한 요청이 없습니다.', type: 'info' });
      }
    } catch (error) {
      console.error('요청 목록 조회 오류:', error);
      const errorMessage = error.response?.data?.message || '권한 요청 목록을 불러오는 데 실패했습니다.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 정비 권한 승인/거부
  const handlePermissionResponse = async (req, status) => {
    setLoading(true);
    let transactionHash = null;

    // 1. 승인일 경우, MetaMask로 컨트랙트 호출 및 트랜잭션 전송
    if (status === 'approved') {
      try {
        if (!window.ethereum) throw new Error("MetaMask not found.");

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // V_CONTRACT_ADDRESS가 정의되지 않았는지 확인하는 최종 방어 로직 추가
        if (!V_CONTRACT_ADDRESS) throw new Error("V_CONTRACT_ADDRESS is not set. Check .env file.");

        const contract = new ethers.Contract(V_CONTRACT_ADDRESS, V_CONTRACT_ABI, signer);

        setMessage({ text: 'MetaMask에서 승인 트랜잭션을 확인해주세요...', type: 'warning' });
        
        const tx = await contract.grantPermission(
            req.ownerAddress, 
            req.requesterAddress, 
            req.vehicleNumber
        );

        const receipt = await tx.wait();
        transactionHash = receipt.hash;
        
        setMessage({ text: '블록체인 트랜잭션이 성공적으로 완료되었습니다!', type: 'success' });

      } catch (error) {
        // ✅ [가장 중요한 부분] 콘솔에 오류 객체 전체를 상세하게 출력
        console.error('❌ MetaMask 트랜잭션 오류 (상세):', error); 
        
        // 사용자에게 보여줄 오류 메시지 상세화
        let reason = "알 수 없는 블록체인 트랜잭션 오류";
        
        if (error.code === 4001) {
            reason = "사용자가 트랜잭션 서명을 거부했습니다.";
        } else if (error.reason && error.reason.includes("Only the vehicle owner")) {
            reason = "권한 오류: 현재 계정이 차량 소유주가 아닙니다."; 
        } else if (error.reason) {
            reason = `컨트랙트 거부: ${error.reason}`;
        } else if (error.message && error.message.includes("insufficient funds")) {
            reason = "잔액 부족: 가스비 지불 불가.";
        } else if (error.message && error.message.includes("V_CONTRACT_ADDRESS")) {
            reason = error.message; // 초기화 오류를 직접 표시
        }
        
        setMessage({ text: `블록체인 트랜잭션 실패: ${reason}`, type: 'error' });
        setLoading(false);
        return; 
      }
    }

    // 2. 백엔드 API 호출 (MongoDB 상태 업데이트 및 최종 처리)
    try {
      const response = await axios.post('/api/maintenance/permission-response', {
        requestId: req._id,
        status: status,
        transactionHash: transactionHash
      });
      
      setMessage({ text: response.data.message, type: 'success' });
      await fetchRequests(); 
    } catch (error) {
      console.error('MongoDB 상태 업데이트 오류:', error);
      const errorMessage = error.response?.data?.message || '권한 처리 중 오류가 발생했습니다.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        정비 권한 승인
      </Typography>
      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Stack spacing={3}>
          {message.text && <Alert severity={message.type}>{message.text}</Alert>}
          
          <Typography variant="h6">받은 정비 권한 요청</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {permissionRequests.length > 0 ? (
                permissionRequests.map((req) => (
                  <Paper key={req._id} variant="outlined" sx={{ mb: 1 }}>
                    <ListItem>
                      <ListItemText
                        primary={`차량 번호: ${req.vehicleNumber}`}
                        secondary={`요청자: ${req.requesterAddress}`}
                      />
                      <ListItemSecondaryAction>
                        <Button
                          color="success"
                          variant="contained"
                          sx={{ mr: 1 }}
                          onClick={() => handlePermissionResponse(req, 'approved')}
                          disabled={loading}
                        >
                          승인
                        </Button>
                        <Button
                          color="error"
                          variant="outlined"
                          onClick={() => handlePermissionResponse(req, 'denied')}
                          disabled={loading}
                        >
                          거부
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  받은 요청이 없습니다.
                </Typography>
              )}
            </List>
          )}

          <Button
            variant="outlined"
            onClick={() => navigate('/main')}
            sx={{ py: 1.5, mt: 2 }}
          >
            메인 페이지로 돌아가기
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}