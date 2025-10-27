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

export default function PartManager() {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [partToDelete, setPartToDelete] = useState(null);

  // 페이지 로드 시 등록된 부품 목록을 불러옵니다.
  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/parts');
      setParts(response.data.parts || []);
    } catch (error) {
      console.error('부품 목록 조회 오류:', error);
      setMessage({ text: '부품 목록을 불러오는 데 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 삭제 확인 다이얼로그 열기
  const handleOpenDialog = (part) => {
    setPartToDelete(part);
    setOpenDialog(true);
  };

  // 삭제 확인 다이얼로그 닫기
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setPartToDelete(null);
  };

  // 부품 삭제 처리
  const handleDelete = async () => {
    if (!partToDelete) return;

    handleCloseDialog();
    setLoading(true);

    try {
      // 백엔드 API 호출: 부품의 고유 ID(_id)를 이용해 DELETE 요청
      await axios.delete(`/api/parts/delete`, {
        data: { partId: partToDelete._id }
      });
      
      setMessage({ text: `부품(${partToDelete.partId}) 정보가 삭제되었습니다.`, type: 'success' });
      
      // 삭제 후 부품 목록을 새로고침
      await fetchParts();

    } catch (error) {
      console.error('부품 삭제 중 오류:', error);
      setMessage({ text: error.response?.data?.message || '부품 삭제에 실패했습니다.', type: 'error' });
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
              부품 관리
            </Typography>

            {message.text && (
              <Alert 
                severity={message.type}
                sx={{ bgcolor: message.type === 'success' ? 'success.dark' : 'error.dark', color: 'white' }}
              >
                {message.text}
              </Alert>
            )}
            
            <Typography variant="h6">등록된 부품 목록</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : (
              <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {parts.length > 0 ? (
                  parts.map((part) => (
                    <Paper key={part._id} variant="outlined" sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <ListItem>
                        <ListItemText 
                          primary={<Typography color="white">{part.partId}</Typography>}
                          secondary={`제조사: ${part.manufacturer} / 연식: ${part.year}`}
                          secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleOpenDialog(part)}>
                            <DeleteIcon sx={{ color: 'rgba(255,100,100,0.8)' }} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ color: 'rgba(255,255,255,0.5)', p: 2 }}>
                    등록된 부품이 없습니다.
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
          <DialogTitle>부품 삭제 확인</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {partToDelete && `정말로 "${partToDelete.partId}" 부품을 삭제하시겠습니까?`}
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