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
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import axios from '../../api';

export default function CustomerVehicle() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]); // 등록된 고객 목록
  const [selectedCustomerId, setSelectedCustomerId] = useState(''); // 선택된 고객 ID
  const [customerVehicles, setCustomerVehicles] = useState([]); // 선택된 고객의 차량 목록
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 1. 페이지 로드 시 등록된 고객 목록을 불러옵니다.
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ text: '로그인 토큰이 없습니다. 다시 로그인해주세요.', type: 'error' });
          return;
        }
        // 백엔드 API 호출: 인증 헤더 추가
        const response = await axios.get('/api/customers', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.customers && response.data.customers.length > 0) {
          setCustomers(response.data.customers);
          setMessage({ text: '등록된 고객 목록을 불러왔습니다. 고객을 선택해주세요.', type: 'info' });
        } else {
          setMessage({ text: '등록된 고객이 없습니다. 먼저 고객을 등록해주세요.', type: 'info' });
        }
      } catch (error) {
        console.error('고객 목록 조회 오류:', error);
        setMessage({ text: '고객 목록을 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // 2. 고객 선택 시 해당 고객의 차량 목록을 불러옵니다.
  const handleCustomerChange = async (event) => {
    const customerId = event.target.value;
    setSelectedCustomerId(customerId);
    setCustomerVehicles([]);

    if (customerId) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ text: '로그인 토큰이 없습니다. 다시 로그인해주세요.', type: 'error' });
          return;
        }
        // 백엔드 API 호출: 인증 헤더 추가
        const response = await axios.get(`/api/vehicles/by-customer?userId=${customerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.vehicles && response.data.vehicles.length > 0) {
          setCustomerVehicles(response.data.vehicles);
          setMessage({ text: `${response.data.vehicles.length}대의 차량 정보를 찾았습니다.`, type: 'success' });
        } else {
          setMessage({ text: '해당 고객에게 등록된 차량이 없습니다.', type: 'info' });
        }
      } catch (error) {
        console.error('고객 차량 조회 오류:', error);
        setMessage({ text: '고객의 차량 정보를 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
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
              고객 차량 정보 조회
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
              <InputLabel id="customer-select-label" sx={{ color: 'white' }}>고객 선택</InputLabel>
              <Select
                labelId="customer-select-label"
                value={selectedCustomerId}
                label="고객 선택"
                onChange={handleCustomerChange}
                sx={{ color: 'white' }}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>조회할 고객을 선택하세요</em>
                </MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer.userId}>
                    {customer.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress color="inherit" />
              </Box>
            )}

            {customerVehicles.length > 0 && (
              <Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                <Typography variant="h6" gutterBottom>
                  "{customers.find(c => c.userId === selectedCustomerId)?.username}" 님의 차량 목록
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {customerVehicles.map((vehicle) => (
                    <Paper 
                      key={vehicle._id} 
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        bgcolor: 'rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                      }}
                      onClick={() => navigate(`/vehicle_history/${vehicle.vehicleNumber}`)}
                    >
                      <ListItem>
                        <ListItemText
                          primary={<Typography color="white">{`차량 번호: ${vehicle.vehicleNumber}`}</Typography>}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="rgba(255,255,255,0.7)">
                                제조사: {vehicle.manufacturer}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2" color="rgba(255,255,255,0.5)">
                                연식: {vehicle.year}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    </Paper>
                  ))}
                </List>
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