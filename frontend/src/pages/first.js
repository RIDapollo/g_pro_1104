import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
} from "@mui/material";

// 배경 이미지 URL (원하는 이미지로 교체 가능)
const backgroundImageUrl = "https://source.unsplash.com/random/1200x900?luxury,car,night";

export default function FirstPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        bgcolor: "black",
        color: "white",
        overflow: "hidden",
        position: 'relative',
      }}
    >
      {/* 배경 이미지 및 그라데이션 오버레이 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 80%)',
          },
        }}
      />

      {/* 콘텐츠 영역 */}
      <Container
        maxWidth="sm"
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          flexGrow: 1,
          pb: 6,
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          sx={{ fontWeight: 'bold', textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}
        >
          bc_vehicle
        </Typography>

        <Typography 
          variant="h6" 
          color="rgba(255, 255, 255, 0.8)" 
          sx={{ mb: 4, textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}
        >
          블록체인 기반 차량 이력 관리 시스템
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/login")}
            sx={{ 
              py: 1.5, 
              bgcolor: 'white', 
              color: 'black', 
              '&:hover': { bgcolor: '#e0e0e0' } 
            }}
          >
            로그인
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/register")}
            sx={{ 
              py: 1.5, 
              borderColor: 'white', 
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            회원가입
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}