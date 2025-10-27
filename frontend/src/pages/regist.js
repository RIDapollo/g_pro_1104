import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import axios from "../api";
import { useNavigate } from "react-router-dom";  // ✅ 추가

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();                 // ✅ 추가

  // MetaMask 연결
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
      } catch (error) {
        setMessage(`지갑 연결 실패: ${error.message}`);
      }
    } else {
      setMessage("MetaMask를 설치해주세요.");
    }
  };

  // ID 중복 확인
  const checkDuplicateUsername = async () => {
    if (!username) return setMessage("ID를 입력하세요.");
    try {
      const res = await axios.get("/api/users/check-id", { params: { username } });
      setMessage(res.data.available ? "사용 가능한 ID입니다." : "이미 사용 중인 ID입니다.");
    } catch (err) {
      const status = err.response?.status;
      setMessage(`중복 확인 오류: ${status || ""} ${err.message}`);
    }
  };

  // 회원가입 처리 (성공 시 / 로 이동)
  const handleRegister = async () => {
    setMessage("");
    if (!username || !password || !walletAddress || !role) {
      setMessage("모든 항목을 입력해주세요.");
      return;
    }
    try {
      await axios.post("/api/users/register", { username, password, walletAddress, role });
      // 폼 초기화
      setUsername("");
      setPassword("");
      setWalletAddress("");
      setRole("user");
      // 메시지 표시 후 바로 이동(원하면 setTimeout으로 약간의 지연도 가능)
      setMessage("회원가입 성공");
      alert("✅ 회원가입이 완료되었습니다.");
      navigate("/");                              // ✅ 초기 화면으로 이동
    } catch (err) {
      if (err.response?.status === 409) setMessage("중복된 메타마스크 주소입니다.");
      else setMessage(`회원가입 실패: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom>회원가입</Typography>
        <Stack spacing={2}>
          <TextField label="아이디" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />
          <Button variant="outlined" onClick={checkDuplicateUsername}>ID 중복 확인</Button>
          <TextField label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />

          <FormControl fullWidth>
            <InputLabel id="role-label">역할 선택</InputLabel>
            <Select labelId="role-label" label="역할 선택" value={role} onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="user">일반 사용자</MenuItem>
              <MenuItem value="external">보험사</MenuItem>
              <MenuItem value="register">정비소</MenuItem>
              <MenuItem value="company">부품 업체</MenuItem>
            </Select>
          </FormControl>

          <TextField label="메타마스크 주소" value={walletAddress} InputProps={{ readOnly: true }} fullWidth />
          <Button variant="outlined" onClick={connectWallet}>메타마스크 연결</Button>

          <Button variant="contained" size="large" onClick={handleRegister}>회원가입</Button>

          <Button variant="text" size="large" onClick={() => navigate("/")}>  처음으로 </Button>
          {message && <Alert severity={message.includes("성공") ? "success" : "error"}>{message}</Alert>}
        </Stack>
      </Paper>
    </Container>
  );
}
