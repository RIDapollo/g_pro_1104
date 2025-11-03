import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from '../../api';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CustomerMaintenanceRegist() {
  const navigate = useNavigate();
  const [shopAddress, setShopAddress] = useState(localStorage.getItem('walletAddress') || '');

  // --- 상태 변수 ---
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [odometer, setOdometer] = useState('');
  
  const [scannedPartInfo, setScannedPartInfo] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 1. 페이지 로드 시 등록된 고객 목록을 불러옵니다.
  useEffect(() => {
    const fetchCustomers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ text: '로그인이 필요합니다.', type: 'error' });
        return;
      }
      setLoading(true);
      try {
        // ✅ 인증 헤더 추가
        const response = await axios.get('/api/customers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.customers && response.data.customers.length > 0) {
          setCustomers(response.data.customers);
          setMessage({ text: '고객 목록을 불러왔습니다. 정비할 고객을 선택하세요.', type: 'info' });
        } else {
          setMessage({ text: '등록된 고객이 없습니다.', type: 'info' });
        }
      } catch (error) {
        setMessage({ text: error.response?.data?.message || '고객 목록을 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // QR 코드 스캐너 로직
  useEffect(() => {
    if (!showScanner) return;
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    const onScanSuccess = (decodedText) => {
        try {
            const partData = JSON.parse(decodedText);
            // ✅ serialNumber가 포함되어 있는지 확인
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

  // 고객 선택 시 해당 고객의 차량 목록을 불러옵니다.
  const handleCustomerChange = async (event) => {
    const customerId = event.target.value;
    const customer = customers.find(c => c.userId === customerId);
    setSelectedCustomer(customer);
    setCustomerVehicles([]);
    setSelectedVehicle(null);

    if (customerId) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ text: '로그인이 필요합니다.', type: 'error' });
          return;
        }
        // ✅ 인증 헤더 추가
        const response = await axios.get(`/api/vehicles/by-customer?userId=${customerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.vehicles && response.data.vehicles.length > 0) {
          setCustomerVehicles(response.data.vehicles);
          setMessage({ text: '차량 목록을 불러왔습니다. 정비할 차량을 선택하세요.', type: 'success' });
        } else {
          setMessage({ text: '해당 고객에게 등록된 차량이 없습니다.', type: 'info' });
        }
      } catch (error) {
        setMessage({ text: error.response?.data?.message || '고객의 차량 정보를 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };
  
  // 차량 선택 핸들러
  const handleVehicleSelectChange = (event) => {
      const selectedNumber = event.target.value;
      const vehicle = customerVehicles.find(v => v.vehicleNumber === selectedNumber);
      setSelectedVehicle(vehicle);
  };

  // 정비 이력 등록 핸들러
  const handleRegister = async () => {
    if (!selectedVehicle || !odometer || !maintenanceDescription || !scannedPartInfo) {
      setMessage({ text: '모든 정보를 입력하고 QR 코드를 스캔해주세요.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ text: '로그인이 필요합니다.', type: 'error' });
        return;
      }

      // ✅ API 호출에 인증 헤더 추가
      const response = await axios.post('/api/maintenance/register', {
        vehicleNumber: selectedVehicle.vehicleNumber,
        odometer: Number(odometer),
        description: maintenanceDescription,
        partInfo: scannedPartInfo, // ✅ serialNumber 포함된 객체
        walletAddress: selectedVehicle.walletAddress, // 소유주 지갑
        requesterAddress: shopAddress, // 정비소 지갑
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('정비 이력이 성공적으로 등록되었습니다.');
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
        <Paper elevation={3} sx={{ p: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
          <Stack spacing={3}>
            <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>
              고객 차량 정비 등록
            </Typography>

            {message.text && (
              <Alert 
                severity={message.type}
                sx={{ bgcolor: `${message.type}.dark`, color: 'white' }}
              >
                {message.text}
              </Alert>
            )}
            
            <Typography variant="h6">1. 고객 및 차량 선택</Typography>
            {/* 고객 선택 드롭다운 */}
            <FormControl fullWidth variant="filled" disabled={loading}>
              <InputLabel id="customer-select-label" sx={{ color: 'white' }}>고객 선택</InputLabel>
              <Select
                labelId="customer-select-label"
                value={selectedCustomer ? selectedCustomer.userId : ''}
                label="고객 선택"
                onChange={handleCustomerChange}
                sx={{ color: 'white' }}
              >
                <MenuItem value=""><em>고객을 선택하세요</em></MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c._id} value={c.userId}>
                    {c.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 고객의 차량 선택 드롭다운 */}
            <FormControl fullWidth variant="filled" disabled={!selectedCustomer || loading}>
              <InputLabel id="vehicle-select-label" sx={{ color: 'white' }}>차량 선택</InputLabel>
              <Select
                labelId="vehicle-select-label"
                value={selectedVehicle ? selectedVehicle.vehicleNumber : ''}
                label="차량 선택"
                onChange={handleVehicleSelectChange}
                sx={{ color: 'white' }}
              >
                <MenuItem value=""><em>차량을 선택하세요</em></MenuItem>
                {customerVehicles.map((v) => (
                  <MenuItem key={v._id} value={v.vehicleNumber}>
                    {v.vehicleNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 차량이 선택된 후에만 정비 데이터 입력 UI 표시 */}
            {selectedVehicle && (
              <Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                <Typography variant="h6">2. 정비 데이터 입력</Typography>
                
                <Button onClick={() => setShowScanner(!showScanner)} variant="outlined" sx={{ mt:2, mb: 2, color: 'white', borderColor: 'white' }}>
                  {showScanner ? '스캔 취소' : '부품 QR 코드 스캔'}
                </Button>
                {showScanner && <div id="qr-reader" style={{ width: '100%' }}></div>}

                {scannedPartInfo && (
                  <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1, mb: 2 }}>
                    <Typography>부품: {scannedPartInfo.partId}</Typography>
                    <Typography>제조사: {scannedPartInfo.manufacturer}</Typography>
                    <Typography>연식: {scannedPartInfo.year}</Typography>
                    {/* ✅ 일련번호가 표시되는지 확인 */}
                    <Typography>일련번호: {scannedPartInfo.serialNumber ? scannedPartInfo.serialNumber.substring(0, 13) + '...' : 'N/A'}</Typography> 
                  </Box>
                )}
                
                <TextField fullWidth label="정비 내용" value={maintenanceDescription} onChange={(e) => setMaintenanceDescription(e.target.value)} multiline rows={2} variant="filled" InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} sx={{ mb: 2 }} disabled={loading} />
                <TextField fullWidth label="정비 당시 주행 거리 (km)" type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} variant="filled" InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} sx={{ mb: 2 }} disabled={loading} />

                <Button variant="contained" onClick={handleRegister} sx={{ py: 1.5, mt: 2, bgcolor: 'white', color: 'black' }} disabled={loading}>
                  정비 이력 등록
                </Button>
              </Box>
            )}

            <Button variant="outlined" onClick={() => navigate('/main')} sx={{ py: 1.5, mt: 2, borderColor: 'white', color: 'white' }}>
              메인 페이지로 돌아가기
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}