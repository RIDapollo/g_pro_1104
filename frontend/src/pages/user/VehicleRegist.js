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

// 임시 데이터 (실제로는 백엔드에서 가져와야 함)
const vehicleManufacturers = [
  { id: 1, name: '현대' },
  { id: 2, name: '기아' },
  { id: 3, name: '쉐보레' },
  { id: 4, name: '르노' },
];

export default function VehicleRegist() {
  const navigate = useNavigate();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [year, setYear] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 컴포넌트가 마운트될 때 지갑 주소를 가져오는 함수
  useEffect(() => {
    const getWalletAddress = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setWalletAddress(accounts[0]);
        } else {
          setMessage({ text: "MetaMask를 설치해주세요.", type: "error" });
        }
      } catch (error) {
        console.error("지갑 연결 오류:", error);
        setMessage({ text: "지갑 연결에 실패했습니다.", type: "error" });
      }
    };
    getWalletAddress();
  }, []);

  const handleRegister = async () => {
    setLoading(true);
    try {
      if (!vehicleNumber || !year || !manufacturer || !walletAddress) {
        setMessage({ text: '모든 필드를 입력하고 지갑을 연결해 주세요.', type: 'error' });
        setLoading(false);
        return;
      }

      // 백엔드 API 호출
      const response = await axios.post('/api/vehicles/register', {
        vehicleNumber: vehicleNumber,
        year: year,
        manufacturer: manufacturer,
        walletAddress: walletAddress,
      });

      alert(response.data.message);
      navigate('/main');

    } catch (error) {
      console.error('차량 등록 중 오류 발생:', error);
      const errorMessage = error.response?.data?.message || '차량 등록에 실패했습니다.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
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
              내 차량 등록
            </Typography>

            {message.text && (
              <Alert 
                severity={message.type}
                sx={{ bgcolor: message.type === 'success' ? 'success.dark' : 'error.dark', color: 'white' }}
              >
                {message.text}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="차량 번호"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              variant="filled"
              InputLabelProps={{ style: { color: 'white' } }}
              inputProps={{ style: { color: 'white' } }}
            />
            <TextField
              fullWidth
              label="연식"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              variant="filled"
              InputLabelProps={{ style: { color: 'white' } }}
              inputProps={{ style: { color: 'white' } }}
            />
            <FormControl fullWidth variant="filled">
              <InputLabel id="manufacturer-select-label" sx={{ color: 'white' }}>제조사</InputLabel>
              <Select
                labelId="manufacturer-select-label"
                value={manufacturer}
                label="제조사"
                onChange={(e) => setManufacturer(e.target.value)}
                sx={{ color: 'white' }}
              >
                <MenuItem value=""><em>선택</em></MenuItem>
                {vehicleManufacturers.map((m) => (
                  <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="지갑 주소"
              value={walletAddress}
              InputProps={{ readOnly: true, style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
              helperText="연결된 MetaMask 지갑 주소"
              FormHelperTextProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
              variant="filled"
            />
            
            <Button
              variant="contained"
              onClick={handleRegister}
              disabled={loading}
              sx={{ py: 1.5, bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#e0e0e0' } }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '차량 등록'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/main')}
              sx={{ py: 1.5, borderColor: 'white', color: 'white', '&:hover': { borderColor: '#ccc', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              메인으로 돌아가기
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}