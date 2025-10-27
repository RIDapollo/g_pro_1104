import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Stack,
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

export default function CustomerManager() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

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
      console.error('고객 목록 조회 오류:', error);
      setMessage({ text: '고객 목록을 불러오는 데 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer) => {
    setCustomerToDelete(customer);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCustomerToDelete(null);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    handleCloseDialog();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/customers/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { customerId: customerToDelete._id }
      });
      
      setMessage({ text: `"${customerToDelete.username}" 고객 정보가 삭제되었습니다.`, type: 'success' });
      await fetchCustomers();
    } catch (error) {
      console.error('고객 삭제 중 오류:', error);
      setMessage({ text: error.response?.data?.message || '고객 삭제에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
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
              고객 관리
            </Typography>

            {message.text && (
              <Alert
                severity={message.type}
                sx={{ bgcolor: message.type === 'success' ? 'success.dark' : (message.type === 'info' ? 'info.dark' : 'error.dark'), color: 'white' }}
              >
                {message.text}
              </Alert>
            )}
            
            <Typography variant="h6">등록된 고객 목록</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : (
              <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <Paper key={customer._id} variant="outlined" sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <ListItem>
                        <ListItemText 
                          primary={<Typography color="white">{`고객 ID: ${customer.username}`}</Typography>}
                          secondary={customer.registeredAt ? `(등록일: ${new Date(customer.registeredAt).toLocaleDateString()})` : ''}
                          secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleOpenDialog(customer)}>
                            <DeleteIcon sx={{ color: 'rgba(255,100,100,0.8)' }} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ color: 'rgba(255,255,255,0.5)', p: 2 }}>
                    등록된 고객이 없습니다.
                  </Typography>
                )}
              </List>
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

        {/* 삭제 확인 다이얼로그 */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          PaperProps={{ sx: { bgcolor: 'rgba(30, 30, 30, 0.95)', color: 'white', backdropFilter: 'blur(5px)' } }}
        >
          <DialogTitle>고객 삭제 확인</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {customerToDelete && `정말로 "${customerToDelete.username}" 고객을 삭제하시겠습니까?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} sx={{ color: 'white' }}>취소</Button>
            <Button onClick={handleDelete} color="error" autoFocus variant="contained">
              삭제
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}