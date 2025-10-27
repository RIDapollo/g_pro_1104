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
  Divider,
} from '@mui/material';
import axios from '../../api';

export default function CustomerRegist() {
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 고객 ID 검색 함수
  const handleSearch = async () => {
    if (!searchId) {
      setMessage({ text: '검색할 고객 ID를 입력해주세요.', type: 'error' });
      return;
    }
    setLoading(true);
    setFoundUser(null);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ text: '로그인 토큰이 없습니다. 다시 로그인해주세요.', type: 'error' });
        setLoading(false);
        return;
      }

      const response = await axios.get(`/api/users/find?username=${searchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.user) {
        setFoundUser(response.data.user);
        setMessage({ text: '고객 정보를 찾았습니다. 아래 정보를 확인 후 등록하세요.', type: 'success' });
      } else {
        setMessage({ text: '해당 ID의 고객을 찾을 수 없습니다.', type: 'info' });
      }
    } catch (error) {
      console.error('고객 검색 중 오류:', error);
      const errorMessage = error.response?.data?.message || '고객 정보를 찾는 데 실패했습니다.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 고객 등록 함수
  const handleRegister = async () => {
    if (!foundUser) {
      setMessage({ text: '먼저 고객을 검색해야 합니다.', type: 'error' });
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ text: '로그인 토큰이 없습니다. 다시 로그인해주세요.', type: 'error' });
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/customers/register', {
        userId: foundUser._id,
        username: foundUser.username,
        walletAddress: foundUser.walletAddress,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('고객이 성공적으로 등록되었습니다.');
      navigate('/main');
      
    } catch (error) {
      console.error('고객 등록 중 오류:', error);
      const errorMessage = error.response?.data?.message || '고객 등록에 실패했습니다.';
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
              고객 등록
            </Typography>

            {message.text && (
              <Alert 
                severity={message.type}
                sx={{ bgcolor: message.type === 'success' ? 'success.dark' : (message.type === 'info' ? 'info.dark' : 'error.dark'), color: 'white' }}
              >
                {message.text}
              </Alert>
            )}
            
            <Typography variant="h6">1. 고객 ID 검색</Typography>
            <TextField
              fullWidth
              label="고객 ID (username)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="등록할 고객의 아이디를 입력하세요"
              variant="filled"
              InputLabelProps={{ style: { color: 'white' } }}
              inputProps={{ style: { color: 'white' } }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{ py: 1.5, bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#e0e0e0' } }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '고객 검색'}
            </Button>

            {foundUser && (
              <Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                <Typography variant="h6">2. 고객 정보 확인 및 등록</Typography>
                <TextField
                  fullWidth
                  label="고객 ID"
                  value={foundUser.username}
                  InputProps={{ readOnly: true, style: { color: 'white' } }}
                  InputLabelProps={{ style: { color: 'white' } }}
                  variant="filled"
                  sx={{ mt: 2 }}
                />
                <TextField
                  fullWidth
                  label="고객 지갑 주소"
                  value={foundUser.walletAddress}
                  InputProps={{ readOnly: true, style: { color: 'white' } }}
                  InputLabelProps={{ style: { color: 'white' } }}
                  variant="filled"
                  sx={{ mt: 2, mb: 2 }}
                />

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleRegister}
                  disabled={loading}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  이 고객을 등록하기
                </Button>
              </Box>
            )}

            <Button
              variant="outlined"
              onClick={() => navigate('/main')}
              sx={{ py: 1.5, mt: 2, borderColor: 'white', color: 'white', '&:hover': { borderColor: '#ccc', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              메인 페이지로 돌아가기
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}