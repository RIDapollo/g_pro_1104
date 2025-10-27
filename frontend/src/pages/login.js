import React, { useState } from "react";
import {
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  TextField,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 실제 로그인 API 호출
      const res = await axios.post("/api/users/login", {
        username: form.username,
        password: form.password,
      });

      // MetaMask 지갑 연동 및 주소 가져오기
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const walletAddress = accounts[0];
        localStorage.setItem("walletAddress", walletAddress);
      } else {
        alert("MetaMask를 설치해주세요.");
        setLoading(false);
        return;
      }

      // 응답 처리
      const { token, role } = res.data;

      // 필요 데이터 저장
      localStorage.setItem("token", token || "");
      localStorage.setItem("role", role);
      localStorage.setItem("username", form.username);

      // 알림창 → 메인 페이지 이동
      alert("로그인에 성공했습니다.");
      navigate("/main");
    } catch (err) {
      alert(err.response?.data?.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            bgcolor: 'rgba(30, 30, 30, 0.9)', // 반투명한 어두운 배경
            color: 'white',
            borderRadius: 3,
            backdropFilter: 'blur(10px)', // 블러 효과
          }}
        >
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
            로그인
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
            서비스를 이용하기 위해 로그인해주세요.
          </Typography>

          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                label="아이디"
                name="username"
                value={form.username}
                onChange={onChange}
                fullWidth
                variant="filled" // 입력 필드 스타일 변경
                InputLabelProps={{ style: { color: 'white' } }}
                inputProps={{ style: { color: 'white' } }}
              />
              <TextField
                label="비밀번호"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                fullWidth
                variant="filled"
                InputLabelProps={{ style: { color: 'white' } }}
                inputProps={{ style: { color: 'white' } }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  py: 1.5,
                  bgcolor: 'white', 
                  color: 'black', 
                  '&:hover': { bgcolor: '#e0e0e0' } 
                }}
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>

              <Button
                variant="text"
                size="large"
                onClick={() => navigate("/")}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                처음으로 돌아가기
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}