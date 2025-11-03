import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, FormControl, InputLabel, MenuItem, Select,
  Stack, Typography, Paper, Alert, CircularProgress, List, ListItem,
  ListItemText, Chip, Link, Menu
} from '@mui/material';
import axios from '../../api';

// 부품 대분류 및 소분류 데이터 (필터링 메뉴용)
const partCategories = {
  "엔진": ["흡기계", "점화계", "연료계", "배기계", "타이밍/구동", "기타 엔진구성"],
  "변속기": ["자동/듀얼클러치/수동", "구동축"],
  "제동": ["마찰부품", "유압계", "전자제어"],
  "조향/서스펜션": ["조향", "현가"],
  "휠/타이어": ["타이어", "휠", "허브/베어링"],
};
const interactivePoints = [
    // 이미지 위에 클릭 포인트는 이 페이지에서 제외합니다. (필터링은 드롭다운으로 대체)
];

export default function CustomerVehicleHistory() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]); // 등록된 고객 목록
  const [selectedCustomer, setSelectedCustomer] = useState(null); // 선택된 고객
  const [customerVehicles, setCustomerVehicles] = useState([]); // 고객의 차량 목록
  
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState(''); // 최종 선택된 차량 번호
  const [vehicleHistory, setVehicleHistory] = useState([]); // 정비 이력
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 1. 페이지 로드 시 등록된 고객 목록을 불러옵니다.
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ text: '로그인이 필요합니다.', type: 'error' });
          return;
        }
        const response = await axios.get('/api/customers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomers(response.data.customers || []);
      } catch (error) {
        setMessage({ text: '고객 목록 조회에 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // 2. 고객 선택 시 해당 고객의 차량 목록을 불러옵니다.
  const handleCustomerChange = async (event) => {
    const customerId = event.target.value;
    const customer = customers.find(c => c.userId === customerId);
    setSelectedCustomer(customer);
    setSelectedVehicleNumber(''); // 차량 초기화
    setVehicleHistory([]); // 이력 초기화

    if (customerId) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/vehicles/by-customer?userId=${customerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomerVehicles(response.data.vehicles || []);
      } catch (error) {
        setMessage({ text: '고객의 차량 정보를 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  // 3. 차량 선택 시 해당 차량의 정비 이력 불러오기
  const handleVehicleSelect = async (e) => {
    const vehicleNumber = e.target.value;
    setSelectedVehicleNumber(vehicleNumber);
    setVehicleHistory([]);
    setMessage({ text: '', type: '' });

    if (vehicleNumber) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/maintenance/history?vehicleNumber=${vehicleNumber}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const history = response.data.history || [];
        setVehicleHistory(history);
        if (history.length === 0) {
          setMessage({ text: `${vehicleNumber} 차량의 정비 이력이 없습니다.`, type: 'info' });
        } else {
          setMessage({ text: '정비 이력을 성공적으로 불러왔습니다.', type: 'success' });
        }
      } catch (error) {
        setMessage({ text: '정비 이력을 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };
  
  // 트랜잭션 해시 링크 생성 헬퍼
  const getEtherscanUrl = (txHash) => {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  const formatPartInfo = (partInfo) => {
    if (!partInfo || typeof partInfo !== 'object') return '정보 없음';
    return `${partInfo.partId} | 제조사: ${partInfo.manufacturer}`;
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>고객 차량 이력 조회</Typography>
            {message.text && <Alert severity={message.type} sx={{ bgcolor: `${message.type}.dark`, color: 'white' }}>{message.text}</Alert>}

            {/* 1단계: 고객 선택 드롭다운 */}
            <FormControl fullWidth variant="filled" disabled={loading}>
              <InputLabel sx={{ color: 'white' }}>고객 선택</InputLabel>
              <Select value={selectedCustomer ? selectedCustomer.userId : ''} label="고객 선택" onChange={handleCustomerChange} sx={{ color: 'white' }}>
                <MenuItem value=""><em>고객을 선택하세요</em></MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c._id} value={c.userId}>
                    {c.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* 2단계: 차량 번호 선택 드롭다운 */}
            <FormControl fullWidth variant="filled" disabled={!selectedCustomer || loading}>
              <InputLabel sx={{ color: 'white' }}>차량 번호 선택</InputLabel>
              <Select value={selectedVehicleNumber} onChange={handleVehicleSelect} sx={{ color: 'white' }} disabled={loading}>
                <MenuItem value=""><em>차량을 선택하세요</em></MenuItem>
                {customerVehicles.map((v) => (
                  <MenuItem key={v.vehicleNumber} value={v.vehicleNumber}>
                    {v.vehicleNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress color="inherit" /></Box>
            ) : (
              selectedVehicleNumber && (
                <Box>
                  <Typography variant="h6" sx={{ mt: 2 }}>{selectedVehicleNumber} 정비 이력 ({vehicleHistory.length}건)</Typography>
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {vehicleHistory.length > 0 ? (
                      vehicleHistory.map((record, index) => (
                        <ListItem key={index} sx={{ p: 0, mb: 1 }}>
                          <Paper variant="outlined" sx={{ width: '100%', p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                             <ListItemText
                                primary={<Typography color="white">{record.description}</Typography>}
                                secondary={
                                  <Stack spacing={1} sx={{ mt: 1 }}>
                                    <Chip label={`주행거리: ${record.odometer} km`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}/>
                                    <Chip label={`정비일: ${new Date(record.timestamp).toLocaleString()}`} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}/>
                                    
                                    {record.transactionHash && (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>
                                          Tx Hash: 
                                          <Link 
                                            href={getEtherscanUrl(record.transactionHash)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            sx={{ color: '#66b2ff', ml: 0.5 }}
                                          >
                                            {`${record.transactionHash.substring(0, 10)}...${record.transactionHash.substring(record.transactionHash.length - 4)}`}
                                          </Link>
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                            부품: {formatPartInfo(record.partInfo)}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Stack>
                                }
                              />
                          </Paper>
                        </ListItem>
                      ))
                    ) : (
                      <Typography align="center" sx={{ color: 'rgba(255,255,255,0.5)', p: 2 }}>
                        정비 이력이 없습니다.
                      </Typography>
                    )}
                  </List>
                </Box>
              )
            )}

            <Button variant="outlined" onClick={() => navigate('/main')} sx={{ py: 1.5, borderColor: 'white', color: 'white' }}>
              메인 페이지로 돌아가기
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
