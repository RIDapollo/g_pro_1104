import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';

// --- 각 역할에 맞는 버튼 데이터 ---
// App.js 라우팅에 맞춰 버튼 목록을 업데이트했습니다.
const buttonData = {
  user: [
    { label: "내 차량 등록", to: "/vehicle_regist", imageUrl: "/images/car_regist.jpg" },
    { label: "내 차량 확인", to: "/vehicle_info", imageUrl: "/images/vehicle_info.jpg" },
    { label: "정비 등록", to: "/maintenance_regist", imageUrl: "/images/maintenance_regist.jpg" },
    { label: "정비 이력", to: "/vehicle_history", imageUrl: "/images/regist_history.jpg" },
  ],
  register: [
    { label: "고객 차량 정비 등록", to: "/customer_maintenance_regist", imageUrl: "/images/maintenance_regist.jpg" },
    { label: "정비 이력 확인", to: "/maintenance_history", imageUrl: "/images/regist_history.jpg" },
    { label: "고객 등록", to: "/customer_regist", imageUrl: "/images/customer.jpg" },
  ],
  company: [
    { label: "부품 등록", to: "/part_regist", imageUrl: "/images/part_regist.jpg" },
    { label: "부품 관리", to: "/part_manager", imageUrl: "/images/product_manager.jpeg" },
  ],
  external: [
      { label: "고객 등록", to: "/customer_regist", imageUrl: "/images/customer.jpg" },
      // ✅ App.js에 정의된 "/customer_info" 경로 추가
      { label: "고객 관리", to: "/customer_info", imageUrl: "/images/customer_manager.jpg" },
      { label: "고객 차량 조회", to: "/customer_vehicle", imageUrl: "/images/vehicle_info.jpg" },
  ]
};

// --- 이미지 카드 버튼 컴포넌트 ---
const ImageCardButton = ({ label, to, imageUrl, onClick }) => (
  <Paper
    onClick={onClick}
    sx={{
      position: 'relative',
      height: 180,
      mb: 2,
      borderRadius: 2,
      overflow: 'hidden',
      cursor: 'pointer',
      '&:hover .overlay': {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <Box
      className="overlay"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s',
      }}
    >
      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', textAlign: 'center', p: 1 }}>
        {label}
      </Typography>
    </Box>
  </Paper>
);


export default function MainPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [navValue, setNavValue] = useState(0);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setUsername(localStorage.getItem("username"));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  const buttonsToShow = buttonData[role] || [];

  return (
    <Box sx={{ bgcolor: 'black', color: 'white', minHeight: '100vh', pb: '56px' }}>
      <Container maxWidth="sm" sx={{ pt: 4 }}>
        <Typography variant="h4" gutterBottom>
          bc_vehicle
        </Typography>
        <Typography variant="h6" sx={{ mb: 4 }}>
          {username ? `${username}님, 어서오세요!` : "환영합니다"}
        </Typography>

        {buttonsToShow.map((button) => (
          <ImageCardButton
            key={button.to}
            label={button.label}
            imageUrl={button.imageUrl}
            onClick={() => navigate(button.to)}
          />
        ))}

        {!role && (
             <Typography>사용자 역할을 불러올 수 없습니다. 다시 로그인해주세요.</Typography>
        )}
      </Container>
      
      {/* --- 하단 내비게이션 바 --- */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={navValue}
          onChange={(event, newValue) => {
            setNavValue(newValue);
            if (newValue === 0) navigate('/main');
            // ✅ App.js의 <Route path="/Info" ...> 경로에 맞게 수정
            if (newValue === 1) navigate('/Info');
            if (newValue === 2) handleLogout();
          }}
          sx={{ bgcolor: 'black' }}
        >
          <BottomNavigationAction label="홈" icon={<HomeIcon />} sx={{ color: 'white' }} />
          <BottomNavigationAction label="내 정보" icon={<PersonIcon />} sx={{ color: 'white' }} />
          <BottomNavigationAction label="로그아웃" icon={<LogoutIcon />} sx={{ color: 'white' }} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}