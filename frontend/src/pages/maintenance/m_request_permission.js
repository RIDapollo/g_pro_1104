import React, { useState } from 'react';
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

export default function MRequestPermission() {
  const navigate = useNavigate();
  const [searchVehicleNumber, setSearchVehicleNumber] = useState('');
  const [vehicleOwner, setVehicleOwner] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 차량 번호 검색
  const handleSearch = async () => {
    if (!searchVehicleNumber) {
      setMessage({ text: '차량 번호를 입력해주세요.', type: 'error' });
      return;
    }
    setLoading(true);
    setVehicleOwner(null);
    setMessage({ text: '', type: '' });

    try {
      // 백엔드 API 호출: 차량 번호를 기반으로 소유주 지갑 주소 조회
      const response = await axios.get(`/api/vehicles/owner?vehicleNumber=${searchVehicleNumber}`);
      if (response.data.ownerAddress) {
        setVehicleOwner(response.data.ownerAddress);
        setMessage({ text: '차량 소유주 정보를 찾았습니다. 정비 권한을 요청하세요.', type: 'success' });
      } else {
        setMessage({ text: '해당 차량 번호로 등록된 차량이 없습니다.', type: 'info' });
      }
    } catch (error) {
      console.error('차량 소유주 검색 중 오류:', error);
      const errorMessage = error.response?.data?.message || '차량 소유주를 찾는 데 실패했습니다.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 정비 권한 요청
  const handleRequestPermission = async () => {
    if (!vehicleOwner || !searchVehicleNumber) {
      setMessage({ text: '먼저 차량 번호를 검색하고 소유주를 확인해야 합니다.', type: 'error' });
      return;
    }
    
    // 정비소 지갑 주소는 localStorage에서 가져오는 것으로 가정
    const requesterAddress = localStorage.getItem('walletAddress');
    if (!requesterAddress) {
      setMessage({ text: '정비소 지갑 주소를 찾을 수 없습니다. 다시 로그인해주세요.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // 백엔드 API를 통해 소유주에게 정비 권한 승인을 요청하는 로직 구현
      const response = await axios.post('/api/maintenance/request-permission', {
        vehicleNumber: searchVehicleNumber,
        ownerAddress: vehicleOwner,
        requesterAddress: requesterAddress,
      });

      setMessage({ text: response.data.message, type: 'success' });
      alert('정비 권한 요청이 성공적으로 전송되었습니다.');
    } catch (error) {
      console.error('정비 권한 요청 중 오류:', error);
      const errorMessage = error.response?.data?.message || '정비 권한 요청에 실패했습니다.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        정비 권한 요청
      </Typography>
      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Stack spacing={3}>
          {message.text && <Alert severity={message.type}>{message.text}</Alert>}
          <TextField
            fullWidth
            label="차량 번호"
            value={searchVehicleNumber}
            onChange={(e) => setSearchVehicleNumber(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '차량 검색'}
          </Button>

          {vehicleOwner && (
            <Box mt={2}>
              <Typography variant="h6">차량 소유주 정보</Typography>
              <TextField
                fullWidth
                label="소유주 지갑 주소"
                value={vehicleOwner}
                InputProps={{ readOnly: true }}
                sx={{ mt: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleRequestPermission}
                sx={{ py: 1.5, mt: 2 }}
                disabled={loading}
              >
                정비 권한 요청
              </Button>
            </Box>
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