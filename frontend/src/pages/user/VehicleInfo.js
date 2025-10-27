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
} from '@mui/material';
import axios from '../../api';

export default function VehicleInfo() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVehicleInfo = async () => {
      setLoading(true);
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          const address = accounts[0];
          setWalletAddress(address);
          
          const response = await axios.get(`/api/vehicles/info?walletAddress=${address}`);
          
          if (response.data.vehicles && response.data.vehicles.length > 0) {
            setVehicles(response.data.vehicles);
            setMessage({ text: "차량 정보를 성공적으로 가져왔습니다.", type: "success" });
          } else {
            setVehicles([]);
            setMessage({ text: "등록된 차량 정보가 없습니다.", type: "info" });
          }
        } else {
          setMessage({ text: "MetaMask를 설치해주세요.", type: "error" });
        }
      } catch (error) {
        console.error("차량 정보 조회 중 오류 발생:", error);
        const errorMessage = error.response?.data?.message || '차량 정보 조회에 실패했습니다.';
        setMessage({ text: errorMessage, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchVehicleInfo();
  }, []);

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
              내 차량 확인
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
              label="지갑 주소"
              value={walletAddress}
              InputProps={{ readOnly: true, style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
              helperText="연결된 MetaMask 지갑 주소"
              FormHelperTextProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
              variant="filled"
            />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : (
              vehicles.length > 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom>등록된 차량 ({vehicles.length}대)</Typography>
                  <Stack spacing={2}>
                    {vehicles.map((vehicle) => (
                      <Paper key={vehicle._id} variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                        <Stack spacing={1.5}>
                          <TextField label="차량 번호" value={vehicle.vehicleNumber} InputProps={{ readOnly: true }} variant="standard" InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }} inputProps={{ style: { color: 'white' } }} />
                          <TextField label="연식" value={vehicle.year} InputProps={{ readOnly: true }} variant="standard" InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }} inputProps={{ style: { color: 'white' } }} />
                          <TextField label="제조사" value={vehicle.manufacturer} InputProps={{ readOnly: true }} variant="standard" InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }} inputProps={{ style: { color: 'white' } }} />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Typography variant="body1" align="center" color="text.secondary" sx={{ color: 'rgba(255,255,255,0.5)', p: 2 }}>
                  등록된 차량 정보가 없습니다.
                </Typography>
              )
            )}
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