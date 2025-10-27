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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from '../../api';

export default function InfoManager() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [userVehicles, setUserVehicles] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchData();
  }, []);

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
        } else {
          setUserVehicles([]);
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

  const handleOpenDialog = (vehicle) => {
    setVehicleToDelete(vehicle);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setVehicleToDelete(null);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;

    handleCloseDialog();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ text: '인증 토큰이 없습니다. 다시 로그인해주세요.', type: 'error' });
        return;
      }

      await axios.delete(`/api/vehicles/delete`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ 인증 헤더 추가
        data: { vehicleNumber: vehicleToDelete.vehicleNumber }
      });
      
      setMessage({ text: `${vehicleToDelete.vehicleNumber} 차량이 삭제되었습니다.`, type: 'success' });
      await fetchData(); // 목록 새로고침

    } catch (error) {
      console.error('차량 삭제 중 오류:', error);
      const errorMessage = error.response?.data?.message || '차량 삭제에 실패했습니다.';
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
              내 정보 관리
            </Typography>

            {message.text && (
              <Alert 
                severity={message.type} 
                sx={{ 
                  bgcolor: message.type === 'success' ? 'success.dark' : 'error.dark', 
                  color: 'white' 
                }}
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
              variant="filled"
            />

            <Typography variant="h6">등록된 차량 목록</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : (
              <List>
                {userVehicles.length > 0 ? (
                  userVehicles.map((vehicle) => (
                    <Paper key={vehicle._id} variant="outlined" sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <ListItem>
                        <ListItemText 
                          primary={<Typography color="white">{vehicle.vehicleNumber}</Typography>}
                          secondary={`제조사: ${vehicle.manufacturer}, 연식: ${vehicle.year}`}
                          secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleOpenDialog(vehicle)}>
                            <DeleteIcon sx={{ color: 'rgba(255,100,100,0.8)' }} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ color: 'rgba(255,255,255,0.5)', p: 2 }}>
                    등록된 차량이 없습니다.
                  </Typography>
                )}
              </List>
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

        {/* 삭제 확인 다이얼로그 */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          PaperProps={{ sx: { bgcolor: 'rgba(30, 30, 30, 0.95)', color: 'white', backdropFilter: 'blur(5px)' } }}
        >
          <DialogTitle>차량 삭제 확인</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {vehicleToDelete && `차량 번호 "${vehicleToDelete.vehicleNumber}"를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} sx={{ color: 'white' }}>취소</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              삭제
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}