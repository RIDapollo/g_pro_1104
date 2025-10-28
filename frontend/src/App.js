import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 페이지 컴포넌트 불러오기
import FirstPage from "./pages/first.js";
import LoginPage from "./pages/login.js";
import RegisterPage from "./pages/regist.js"; 
import MainPage from "./pages/main.js";
import Info from "./pages/Info.js";

//company페이지
import PartRegistPage from './pages/company/PartRegist';
import PartManager from './pages/company/PartManager.js';

//user 페이지
import VehicleRegist from './pages/user/VehicleRegist';
import VehicleInfo from './pages/user/VehicleInfo';
import MaintenanceRegist from './pages/user/MaintenanceRegist';
import VehicleHistory from './pages/user/VehicleHistory';
import U_InfoManager from "./pages/user/InfoManager";
import UPermission from "./pages/user/u_permission"; 
import VehicleDetailHistory from './pages/user/VehicleDetailHistory';

//maintenance 페이지
import MRequestPermission from "./pages/maintenance/m_request_permission"; 
import MHistory from "./pages/maintenance/MaintenanceHistory";
import MMaintenanceRegist from "./pages/maintenance/Maintenance_m";

//extra 페이지
import CustomerRegist from './pages/other/customerRegist';
import CustomerVehicle from './pages/other/customervehicle.js';
import CustomerManager from './pages/other/customermanager.js';



console.log('App.js 로드: REACT_APP_CONTRACT_ADDRESS 값:', process.env.REACT_APP_CONTRACT_ADDRESS);


export default function App() {
  return (
    <Router>
    <h1 style={{ color: 'red', position: 'absolute', zIndex: 9999 }}>
        Vercel 배포 v3 테스트1028/1945
      </h1>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/Info" element={<Info />} />

        {/*company 라우팅*/}
        <Route path="/part_regist" element={<PartRegistPage />}/>
        <Route path="/part_manager" element={<PartManager />}/>

        {/*user 라우팅*/}
        <Route path="/vehicle_regist" element={<VehicleRegist />} />
        <Route path="/vehicle_info" element={<VehicleInfo />} />
        <Route path="/maintenance_regist" element={<MaintenanceRegist />} />
        <Route path="/vehicle_history" element={<VehicleHistory />} />
        <Route path="/info_manager" element={<U_InfoManager />} />
        <Route path="/u_permission" element={<UPermission />} />  
        <Route path="/vehicle_history/:vehicleNumber" element={<VehicleDetailHistory />} />


        {/*maintenance 라우팅*/}
        <Route path="/m_request_permission" element={<MRequestPermission />}/> 
        <Route path="/maintenance_history" element={<MHistory />}/> 
        <Route path="/customer_maintenance_regist" element={<MMaintenanceRegist />}/> 

        {/*extra 라우팅*/}
        <Route path="/customer_regist" element={<CustomerRegist />}/> 
        <Route path="/customer_vehicle" element={<CustomerVehicle />}/> 
        <Route path="/customer_info" element={<CustomerManager />}/> 

        {/* 필요한 경우 다른 페이지 경로도 추가 */}
      </Routes>
    </Router>
  );
}
