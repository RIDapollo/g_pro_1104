import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import axios from '../../api';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function MaintenanceRegist() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [odometer, setOdometer] = useState('');
  const [scannedPartInfo, setScannedPartInfo] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const address = accounts[0];
          setWalletAddress(address);

          // ✅ 1. 토큰 가져오기
          const token = localStorage.getItem('token');
          if (!token) {
            setMessage({ text: '로그인이 필요합니다.', type: 'error' });
            return;
          }

          // ✅ 2. API 호출 시 인증 헤더 추가
          const response = await axios.get(`/api/vehicles/info?walletAddress=${address}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.vehicles.length > 0) {
            setUserVehicles(response.data.vehicles);
            setMessage({ text: '차량 목록을 불러왔습니다.', type: 'info' });
          } else {
            setMessage({ text: '등록된 차량이 없습니다.', type: 'info' });
          }
        } else {
          setMessage({ text: 'MetaMask를 설치해주세요.', type: 'error' });
        }
      } catch (error) {
        setMessage({ text: '차량 정보를 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // QR 코드 스캐너 관리
  useEffect(() => {
    if (!showScanner) return;
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    const onScanSuccess = (decodedText) => {
      try {
        const partData = JSON.parse(decodedText);
        if (partData.partId && partData.year && partData.manufacturer && partData.serialNumber) {
          setScannedPartInfo(partData);
          setMessage({ text: '✅ QR 코드를 성공적으로 인식했습니다.', type: 'success' });
        } else {
          setMessage({ text: '유효하지 않은 부품 정보가 포함된 QR 코드입니다. (일련번호 누락)', type: 'error' });
        }
      } catch (e) {
        setMessage({ text: 'QR 코드 데이터 형식이 올바르지 않습니다.', type: 'error' });
      } finally {
        scanner.clear().catch(error => console.error("스캐너 정리 실패.", error));
        setShowScanner(false);
      }
    };
    scanner.render(onScanSuccess, () => {});
    return () => {
      if (scanner && scanner.getState()) {
        scanner.clear().catch(error => console.error("스캐너 정리 실패.", error));
      }
    };
  }, [showScanner]);

  // 정비 이력 등록
  const handleRegister = async () => {
    setLoading(true);
    try {
      if (!selectedVehicleNumber || !odometer || !maintenanceDescription || !scannedPartInfo) {
        setMessage({ text: '모든 필드를 입력하고 QR 코드를 스캔해주세요.', type: 'error' });
        setLoading(false);
        return;
      }
      
      // ✅ 3. 토큰 가져오기
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ text: '로그인이 필요합니다.', type: 'error' });
        setLoading(false);
        return;
      }

      // ✅ 4. API 호출 시 인증 헤더 및 requesterAddress 추가
      const response = await axios.post('/api/maintenance/register', {
        vehicleNumber: selectedVehicleNumber,
        odometer: Number(odometer),
        description: maintenanceDescription,
        partInfo: scannedPartInfo,
        walletAddress: walletAddress,
        requesterAddress: walletAddress, // 사용자가 직접 등록하므로 소유주=요청자
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(response.data.message);
      navigate('/main');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || '정비 이력 등록에 실패했습니다.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            bgcolor: 'rgba(30, 30, 30, 0.9)',
            color: 'white',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>
              정비 이력 등록
            </Typography>

            {message.text && (
              <Alert 
                severity={message.type}
                sx={{ bgcolor: message.type === 'success' ? 'success.dark' : (message.type === 'info' ? 'info.dark' : 'error.dark'), color: 'white' }}
              >
                {message.text}
              </Alert>
            )}
            
            <FormControl fullWidth variant="filled">
              <InputLabel id="vehicle-select-label" sx={{ color: 'white' }}>차량 번호 선택</InputLabel>
              <Select
                labelId="vehicle-select-label"
                value={selectedVehicleNumber}
                label="차량 번호 선택"
                onChange={(e) => setSelectedVehicleNumber(e.target.value)}
                sx={{ color: 'white' }}
                disabled={loading}
              >
                <MenuItem value=""><em>선택</em></MenuItem>
                {userVehicles.map((v) => (
                  <MenuItem key={v.vehicleNumber} value={v.vehicleNumber}>
                    {v.vehicleNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                부품 QR 코드 스캔
              </Typography>
              <Button
                  variant="outlined"
                  onClick={() => setShowScanner(!showScanner)}
                  disabled={loading}
                  sx={{ color: 'white', borderColor: 'white' }}
              >
                  {showScanner ? '스캔 취소' : '카메라로 스캔'}
              </Button>
              {showScanner && <div id="qr-reader" style={{ width: '100%', marginTop: '16px' }}></div>}
            </Box>

            {scannedPartInfo && (
              <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>✅ 스캔된 부품 정보</Typography>
                <Typography>부품: {scannedPartInfo.partId}</Typography>
                <Typography>연식: {scannedPartInfo.year}</Typography>
                <Typography>제조사: {scannedPartInfo.manufacturer}</Typography>
                <Typography>일련번호: {scannedPartInfo.serialNumber.substring(0, 13)}...</Typography> 
              </Box>
            )}

            <TextField
              fullWidth
              label="정비 내용"
              value={maintenanceDescription}
              onChange={(e) => setMaintenanceDescription(e.target.value)}
              multiline
              rows={2}
              variant="filled"
              InputLabelProps={{ style: { color: 'white' } }}
              inputProps={{ style: { color: 'white' } }}
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="정비 당시 주행 거리"
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              variant="filled"
              InputLabelProps={{ style: { color: 'white' } }}
              inputProps={{ style: { color: 'white' } }}
              disabled={loading}
            />

            <Button
              variant="contained"
              onClick={handleRegister}
              disabled={loading}
              sx={{ py: 1.5, bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#e0e0e0' } }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '정비 이력 등록'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/main')}
              sx={{ py: 1.5, borderColor: 'white', color: 'white', '&:hover': { borderColor: '#ccc', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              메인 페이지로 돌아가기
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}