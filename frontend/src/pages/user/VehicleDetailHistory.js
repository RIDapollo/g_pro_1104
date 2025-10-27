import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Container, Stack, Typography, Paper, Alert,
  CircularProgress, List, ListItem, ListItemText, Chip
} from '@mui/material';
import axios from '../../api';

export default function VehicleDetailHistory() {
  const navigate = useNavigate();
  const { vehicleNumber } = useParams(); // URL 파라미터에서 차량 번호 가져오기
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!vehicleNumber) return;
      try {
        const response = await axios.get(`/api/maintenance/history?vehicleNumber=${vehicleNumber}`);
        if (response.data.history && response.data.history.length > 0) {
          setVehicleHistory(response.data.history);
        } else {
          setMessage({ text: '해당 차량의 정비 이력이 없습니다.', type: 'info' });
        }
      } catch (error) {
        setMessage({ text: '정비 이력을 불러오는 데 실패했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [vehicleNumber]);

  const formatPartInfo = (partInfo) => {
    if (!partInfo || typeof partInfo !== 'object') return '정보 없음';
    return `${partInfo.partId} | 제조사: ${partInfo.manufacturer}`;
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>
              차량 정비 이력 ({vehicleNumber})
            </Typography>
            {message.text && <Alert severity={message.type} sx={{ bgcolor: `${message.type}.dark`, color: 'white' }}>{message.text}</Alert>}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : (
              <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {vehicleHistory.map((record, index) => (
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
                ))}
              </List>
            )}
            <Button variant="outlined" onClick={() => navigate(-1)} sx={{ py: 1.5, borderColor: 'white', color: 'white' }}>
              뒤로가기
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}