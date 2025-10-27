import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, FormControl, InputLabel, MenuItem, Select,
  Stack, Typography, Paper, Alert, CircularProgress, List, ListItem,
  ListItemText, Chip, Menu
} from '@mui/material';
import axios from '../../api';

// ✅ 1. 부품 분류 데이터 키 값 수정 (간결하게)
const partCategories = {
  "엔진": ["흡기계", "점화계", "연료계", "배기계", "타이밍/구동", "기타 엔진구성"],
  "변속기": ["자동/듀얼클러치/수동", "구동축"],
  "제동": ["마찰부품", "유압계", "전자제어"],
  "조향/서스펜션": ["조향", "현가"],
  "휠/타이어": ["타이어", "휠", "허브/베어링"],
};

// ✅ 2. 인터랙티브 포인트 이름도 위의 키 값과 일치시킴
const interactivePoints = [
  { name: '엔진', top: '50%', left: '28%' },
  { name: '변속기', top: '55%', left: '45%' },
  { name: '휠/타이어', top: '75%', left: '78%' },
  { name: '제동', top: '75%', left: '22%' },
  { name: '조향/서스펜션', top: '65%', left: '15%' },
];

export default function VehicleHistory() {
  const navigate = useNavigate();
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState('');
  const [allHistory, setAllHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMajorCategory, setSelectedMajorCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const walletAddress = localStorage.getItem('walletAddress');
        if (!walletAddress) {
          setMessage({ text: '지갑 정보를 찾을 수 없습니다.', type: 'error' });
          return;
        }
        const response = await axios.get(`/api/vehicles/info?walletAddress=${walletAddress}`);
        setUserVehicles(response.data.vehicles || []);
      } catch (error) {
        setMessage({ text: '차량 목록 조회에 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVehicleSelect = async (e) => {
    const vehicleNumber = e.target.value;
    setSelectedVehicleNumber(vehicleNumber);
    setAllHistory([]);
    setFilteredHistory([]);
    setMessage({ text: '', type: '' });

    if (vehicleNumber) {
      setLoading(true);
      try {
        const response = await axios.get(`/api/maintenance/history?vehicleNumber=${vehicleNumber}`);
        const history = response.data.history || [];
        setAllHistory(history);
        if (history.length === 0) {
          setMessage({ text: '해당 차량의 정비 이력이 없습니다.', type: 'info' });
        }
      } catch (error) {
        setMessage({ text: '정비 이력을 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };
  
  // ✅ 3. 불필요한 split 로직 제거
  const handleMajorCategoryClick = (event, categoryName) => {
    setAnchorEl(event.currentTarget);
    setSelectedMajorCategory(categoryName);
    setFilteredHistory([]);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMajorCategory(null);
  };

  const handleSubCategorySelect = (subCategory) => {
    const filtered = allHistory.filter(record => 
      record.partInfo && record.partInfo.partId.includes(subCategory)
    );
    setFilteredHistory(filtered);
    if(filtered.length === 0) {
        setMessage({ text: `'${subCategory}'에 대한 정비 이력이 없습니다.`, type: 'info' });
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>내 차량 이력 확인</Typography>
            {message.text && <Alert severity={message.type} sx={{ bgcolor: `${message.type}.dark`, color: 'white' }}>{message.text}</Alert>}

            <FormControl fullWidth variant="filled">
              <InputLabel sx={{ color: 'white' }}>차량 번호 선택</InputLabel>
              <Select value={selectedVehicleNumber} onChange={handleVehicleSelect} sx={{ color: 'white' }} disabled={loading}>
                <MenuItem value=""><em>차량을 선택하세요</em></MenuItem>
                {userVehicles.map((v) => (
                  <MenuItem key={v.vehicleNumber} value={v.vehicleNumber}>{v.vehicleNumber}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress color="inherit" /></Box>}

            {selectedVehicleNumber && !loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                  <img src="/images/car-silhouette.jpg" alt="Car Silhouette" style={{ width: '100%', height: 'auto' }} />
                  {interactivePoints.map(point => (
                    <Button
                      key={point.name}
                      onClick={(e) => handleMajorCategoryClick(e, point.name)}
                      sx={{
                        position: 'absolute',
                        top: point.top,
                        left: point.left,
                        transform: 'translate(-50%, -50%)',
                        width: 24,
                        height: 24,
                        minWidth: 24,
                        borderRadius: '50%',
                        bgcolor: 'red',
                        '&:hover': { bgcolor: '#ff4d4d' },
                        animation: 'pulse 2s infinite'
                      }}
                    />
                  ))}
                  <style>{`
                    @keyframes pulse {
                      0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
                      70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
                      100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
                    }
                  `}</style>
                </Box>
              </Box>
            )}

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              {selectedMajorCategory && partCategories[selectedMajorCategory]?.map(sub => (
                <MenuItem key={sub} onClick={() => handleSubCategorySelect(sub)}>{sub}</MenuItem>
              ))}
            </Menu>

            {filteredHistory.length > 0 && (
              <List>
                {filteredHistory.map((record, index) => (
                  <ListItem key={index} sx={{ p: 0, mb: 1 }}>
                    <Paper variant="outlined" sx={{ width: '100%', p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                       <ListItemText
                          primary={<Typography color="white">{record.description}</Typography>}
                          secondary={
                            <Stack spacing={1} sx={{ mt: 1 }}>
                              <Chip label={`주행거리: ${record.odometer} km`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}/>
                              <Chip label={`정비일: ${new Date(record.timestamp).toLocaleString()}`} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}/>
                            </Stack>
                          }
                        />
                    </Paper>
                  </ListItem>
                ))}
              </List>
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