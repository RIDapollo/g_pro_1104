import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, Stack, TextField, Typography, Paper, Alert,
  CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from '../api';

export default function InfoManager() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({
    username: localStorage.getItem('username') || '',
    role: localStorage.getItem('role') || '',
    walletAddress: localStorage.getItem('walletAddress') || '',
  });

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [userVehicles, setUserVehicles] = useState([]);
  const [registeredCustomers, setRegisteredCustomers] = useState([]);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, type: '', item: null });

  // 역할에 따라 필요한 초기 데이터 로드
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ text: '로그인이 필요합니다.', type: 'error' });
      return;
    }

    if (currentUser.role === 'user') {
      fetchUserVehicles(token);
    } else if (currentUser.role === 'register') {
      fetchRegisteredCustomers(token);
    }
  }, [currentUser.role]);

  // (사용자용) 등록된 차량 목록 조회
  const fetchUserVehicles = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/vehicles/info?walletAddress=${currentUser.walletAddress}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserVehicles(response.data.vehicles || []);
    } catch (error) {
      setMessage({ text: '차량 목록 조회에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // (정비소용) 등록한 고객 목록 조회
  const fetchRegisteredCustomers = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegisteredCustomers(response.data.customers || []);
    } catch (error) {
      setMessage({ text: '고객 목록 조회에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // 비밀번호 변경 핸들러
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
        setMessage({ text: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.', type: 'error' });
        return;
    }
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        await axios.post('/api/users/change-password', passwordForm, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMessage({ text: '비밀번호가 성공적으로 변경되었습니다.', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
        setMessage({ text: error.response?.data?.message || '비밀번호 변경에 실패했습니다.', type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  // 삭제 처리 핸들러
  const handleDelete = async () => {
    const { type, item } = dialog;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (type === 'vehicle') {
        await axios.delete(`/api/vehicles/delete`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { vehicleId: item._id }
        });
        await fetchUserVehicles(token);
        setMessage({ text: '차량이 삭제되었습니다.', type: 'success' });
      } else if (type === 'customer') {
        await axios.delete(`/api/customers/delete`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { customerId: item._id }
        });
        await fetchRegisteredCustomers(token);
        setMessage({ text: '고객이 삭제되었습니다.', type: 'success' });
      } else if (type === 'withdrawal') {
        await axios.delete(`/api/users/withdraw`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('회원 탈퇴가 완료되었습니다.');
        localStorage.clear();
        navigate('/login');
      }
    } catch (error) {
      setMessage({ text: `삭제 중 오류가 발생했습니다: ${error.response?.data?.message}`, type: 'error' });
    } finally {
      setLoading(false);
      setDialog({ open: false, type: '', item: null });
    }
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, bgcolor: 'rgba(30, 30, 30, 0.9)', color: 'white', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
          <Stack spacing={3}>
            <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>내 정보 관리</Typography>
            {message.text && <Alert severity={message.type} sx={{ bgcolor: `${message.type}.dark`, color: 'white' }}>{message.text}</Alert>}

            {/* 공통 기능: 비밀번호 변경 */}
            <Box component="form" onSubmit={handlePasswordChange}>
              <Typography variant="h6">비밀번호 변경</Typography>
              <TextField fullWidth label="현재 비밀번호" type="password" variant="filled" sx={{ mt: 2, mb: 1 }} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
              <TextField fullWidth label="새 비밀번호" type="password" variant="filled" InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
              <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={loading}>비밀번호 변경</Button>
            </Box>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

            {/* 개별 기능 */}
            {currentUser.role === 'user' && (
              <Box>
                <Typography variant="h6">등록 차량 삭제</Typography>
                <List>
                  {userVehicles.map(v => (
                    <Paper key={v._id} variant="outlined" sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <ListItem>
                        <ListItemText primary={<Typography color="white">{v.vehicleNumber}</Typography>} secondary={`${v.manufacturer} / ${v.year}년식`} secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }} />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => setDialog({ open: true, type: 'vehicle', item: v })}>
                            <DeleteIcon sx={{ color: 'rgba(255,100,100,0.8)' }} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              </Box>
            )}

            {currentUser.role === 'register' && (
              <Box>
                <Typography variant="h6">등록 고객 삭제</Typography>
                <List>
                  {registeredCustomers.map(c => (
                    <Paper key={c._id} variant="outlined" sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <ListItem>
                        <ListItemText primary={<Typography color="white">{c.username}</Typography>} />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => setDialog({ open: true, type: 'customer', item: c })}>
                            <DeleteIcon sx={{ color: 'rgba(255,100,100,0.8)' }} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              </Box>
            )}

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

            {/* 공통 기능: 회원 탈퇴 */}
            <Box>
              <Typography variant="h6">회원 탈퇴</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', my: 1 }}>
                회원 탈퇴 시 모든 정보가 영구적으로 삭제되며 복구할 수 없습니다.
              </Typography>
              <Button variant="contained" color="error" onClick={() => setDialog({ open: true, type: 'withdrawal' })} disabled={loading}>
                회원 탈퇴
              </Button>
            </Box>

            <Button variant="outlined" onClick={() => navigate('/main')} sx={{ py: 1.5, borderColor: 'white', color: 'white' }}>
              메인으로 돌아가기
            </Button>
          </Stack>
        </Paper>

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={dialog.open} onClose={() => setDialog({ open: false, type: '', item: null })} PaperProps={{ sx: { bgcolor: 'rgba(30, 30, 30, 0.95)', color: 'white' } }}>
          <DialogTitle>정말로 삭제하시겠습니까?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {dialog.type === 'vehicle' && `차량(${dialog.item?.vehicleNumber}) 정보를 삭제합니다.`}
              {dialog.type === 'customer' && `고객(${dialog.item?.username}) 정보를 삭제합니다.`}
              {dialog.type === 'withdrawal' && '이 작업은 되돌릴 수 없습니다.'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog({ open: false, type: '', item: null })} sx={{ color: 'white' }}>취소</Button>
            <Button onClick={handleDelete} color="error" variant="contained" autoFocus>삭제</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}