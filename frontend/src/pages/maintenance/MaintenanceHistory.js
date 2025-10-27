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
  Chip,
} from '@mui/material';
import axios from '../../api';

export default function VehicleHistory() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState('');
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const address = accounts[0];
          setWalletAddress(address);
          
          const response = await axios.get(`/api/vehicles/info?walletAddress=${address}`);
          if (response.data.vehicles && response.data.vehicles.length > 0) {
            setUserVehicles(response.data.vehicles);
            setMessage({ text: '차량 목록을 불러왔습니다. 조회할 차량을 선택하세요.', type: 'info' });
          } else {
            setMessage({ text: '등록된 차량이 없습니다.', type: 'info' });
          }
        } else {
          setMessage({ text: 'MetaMask를 설치해주세요.', type: 'error' });
        }
      } catch (error) {
        console.error('데이터 조회 오류:', error);
        setMessage({ text: '차량 정보를 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVehicleSelect = async (e) => {
    const vehicleNumber = e.target.value;
    setSelectedVehicleNumber(vehicleNumber);
    setVehicleHistory([]);

    if (vehicleNumber) {
      setLoading(true);
      try {
        const response = await axios.get(`/api/maintenance/history?vehicleNumber=${vehicleNumber}`);
        if (response.data.history && response.data.history.length > 0) {
          setVehicleHistory(response.data.history);
          setMessage({ text: '정비 이력을 성공적으로 불러왔습니다.', type: 'success' });
        } else {
          setMessage({ text: '해당 차량의 정비 이력이 없습니다.', type: 'info' });
        }
      } catch (error) {
        console.error('정비 이력 조회 오류:', error);
        setMessage({ text: '정비 이력을 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const formatPartInfo = (partInfo) => {
    if (!partInfo || typeof partInfo !== 'object') return '정보 없음';
    return `${partInfo.partId} | 제조사: ${partInfo.manufacturer}`;
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
              차량 이력 확인
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
                onChange={handleVehicleSelect}
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
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : (
              selectedVehicleNumber && (
                <Box> {/* ✅ 이 Box가 List와 Typography를 감쌉니다. */}
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {vehicleHistory.length > 0 ? (
                      vehicleHistory.map((record, index) => (
                        <ListItem key={index} sx={{ p: 0, mb: 2 }}>
                          <Paper variant="outlined" sx={{ width: '100%', p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                            <ListItemText
                              primary={<Typography color="white">{record.description}</Typography>}
                              secondary={
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                  <Chip label={`주행거리: ${record.odometer} km`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}/>
                                  <Chip label={`정비일: ${new Date(record.timestamp).toLocaleString()}`} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}/>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', pt: 1 }}>
                                    부품 정보: {formatPartInfo(record.partInfo)}
                                  </Typography>
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