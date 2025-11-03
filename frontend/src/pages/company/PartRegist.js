import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Paper,
    Alert,
    CircularProgress,
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import axios from '../../api';

// 부품 분류 데이터
const partsData = {
    "엔진/흡·배기(파워트레인 핵심)": ["흡기계", "점화계", "연료계", "배기계", "타이밍/구동", "기타 엔진구성"],
    "변속기/동력전달": ["자동/듀얼클러치/수동", "구동축"],
    "냉각/윤활": ["냉각계", "윤활계"],
    "제동(브레이크)/ABS·ESC": ["마찰부품", "유압계", "전자제어"],
    "조향/서스펜션": ["조향", "현가"],
    "전기/전자(12V/48V)": ["전원계", "제어유닛", "조명/외장전기"],
    "공조(HVAC)": ["냉방", "송풍/난방"],
    "차체/외장·유리": ["패널/트림", "램프/와이퍼/도어락", "유리"],
    "실내/편의·인포테인먼트": ["시트/에어백", "편의", "인포테인먼트"],
    "안전/ADAS": ["센싱", "제어/캘리브레이션"],
    "휠/타이어": ["타이어", "휠", "허브/베어링", "TPMS", "허브/휠볼트·너트"],
    "유체/소모품": ["엔진오일", "ATF/DCT/무단변속오일", "브레이크액", "냉각수", "디퍼렌셜/트랜스퍼 오일", "파워스티어링오일(유압식)", "윈도워셔액", "그리스/실런트", "각종 가스켓·오링", "벨트·호스"],
    "전기·수소·하이브리드/전기차(EV/HEV/PHEV) 특화": ["고전압(HV)", "구동/전력", "충전부", "열펌프/전기히터"],
};

export default function PartRegist() {
    const navigate = useNavigate();
    const [mainCategory, setMainCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [year, setYear] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [qrCodeData, setQrCodeData] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const qrRef = useRef(); // QR 코드 다운로드를 위한 ref

    // 대분류 선택 시 중분류 초기화
    const handleMainCategoryChange = (e) => {
        setMainCategory(e.target.value);
        setSubCategory('');
    };
    
    // QR 코드 다운로드 함수
    const downloadQRCode = (filename = 'part-qrcode.png') => {
        // ref를 통해 canvas 요소에 접근
        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) {
            // 캔버스 데이터를 이미지 URL로 변환
            const image = canvas.toDataURL("image/png");
            // 다운로드를 위한 임시 a 태그 생성
            const link = document.createElement("a");
            link.href = image;
            link.download = filename; // 동적 파일명 설정
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // 부품 등록 핸들러
    const handleRegister = async () => {
        setLoading(true);
        try {
            if (!mainCategory || !subCategory || !year || !manufacturer) {
                setMessage({ text: '모든 필드를 입력해 주세요.', type: 'error' });
                setLoading(false);
                return;
            }

            const partInfo = `${mainCategory} - ${subCategory}`;
            const registrationDate = new Date().toISOString();
            
            // ✅ 1. 부품 고유 일련번호 (UUID) 생성
            const serialNumber = crypto.randomUUID();

            // ✅ 2. QR 코드에 고유 일련번호 추가
            const dataToEncode = JSON.stringify({
                partId: partInfo, // 부품 종류
                year: year,
                manufacturer: manufacturer,
                registrationDate: registrationDate,
                serialNumber: serialNumber // ✅ 고유 일련번호
            });

            // QR 코드 데이터를 state에 저장하여 화면에 렌더링
            setQrCodeData(dataToEncode);

            // ✅ 3. 백엔드 API로 고유 일련번호 전송
            const response = await axios.post('/api/parts/register', {
                partId: partInfo,
                year: year,
                manufacturer: manufacturer,
                registrationDate: registrationDate,
                serialNumber: serialNumber, // ✅ 고유 일련번호
                qrCode: dataToEncode,
            });
            
            setMessage({ text: response.data.message, type: 'success' });
            
            // ✅ 4. 등록 성공 후 QR 코드 자동 다운로드
            // state 업데이트가 렌더링될 시간을 0.5초 정도 확보
            setTimeout(() => {
                downloadQRCode(`part-qrcode-${manufacturer}-${year}-${serialNumber.substring(0, 4)}.png`);
            }, 500);

        } catch (error) {
            console.error('부품 등록 중 오류 발생:', error);
            const errorMessage = error.response?.data?.message || '부품 등록에 실패했습니다.';
            setMessage({ text: `${errorMessage} (상태 코드: ${error.response?.status})`, type: 'error' });
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
                            부품 등록
                        </Typography>

                        {message.text && (
                            <Alert 
                                severity={message.type}
                                sx={{ bgcolor: message.type === 'success' ? 'success.dark' : 'error.dark', color: 'white' }}
                            >
                                {message.text}
                            </Alert>
                        )}
                        
                        <FormControl fullWidth variant="filled">
                            <InputLabel id="main-category-label" sx={{ color: 'white' }}>대분류</InputLabel>
                            <Select
                                labelId="main-category-label"
                                value={mainCategory}
                                label="대분류"
                                onChange={handleMainCategoryChange}
                                sx={{ color: 'white' }}
                                disabled={loading}
                            >
                                <MenuItem value=""><em>선택</em></MenuItem>
                                {Object.keys(partsData).map((category) => (
                                    <MenuItem key={category} value={category}>{category}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth variant="filled" disabled={!mainCategory || loading}>
                            <InputLabel id="sub-category-label" sx={{ color: 'white' }}>중분류</InputLabel>
                            <Select
                                labelId="sub-category-label"
                                value={subCategory}
                                label="중분류"
                                onChange={(e) => setSubCategory(e.target.value)}
                                sx={{ color: 'white' }}
                            >
                                <MenuItem value=""><em>선택</em></MenuItem>
                                {mainCategory && partsData[mainCategory].map((sub) => (
                                    <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <TextField
                            fullWidth
                            label="연식"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            variant="filled"
                            InputLabelProps={{ style: { color: 'white' } }}
                            inputProps={{ style: { color: 'white' } }}
                            disabled={loading}
                        />
                        
                        <TextField
                            fullWidth
                            label="제작 업체"
                            value={manufacturer}
                            onChange={(e) => setManufacturer(e.target.value)}
                            variant="filled"
                            InputLabelProps={{ style: { color: 'white' } }}
                            inputProps={{ style: { color: 'white' } }}
                            disabled={loading}
                        />
                        
                        <Button
                            variant="contained"
                            onClick={handleRegister}
                            disabled={loading}
                            sx={{ py: 1.5, bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#e0e0e0' } }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : '부품 등록 및 QR 생성'}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/main')}
                          sx={{ py: 1.5, borderColor: 'white', color: 'white', '&:hover': { borderColor: '#ccc', bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                          메인으로 돌아가기
                        </Button>
                    </Stack>
                </Paper>
                
                {qrCodeData && (
                    <Paper elevation={3} sx={{ p: 4, mt: 3, bgcolor: 'rgba(30, 30, 30, 0.9)', borderRadius: 3 }}>
                        {/* ✅ ref={qrRef} 추가 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} ref={qrRef}>
                            <Typography variant="h6" gutterBottom color="white">
                                생성된 QR 코드 (자동 다운로드됩니다)
                            </Typography>
                            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                                {/* ✅ QRCodeCanvas가 렌더링되도록 수정 */}
                                <QRCodeCanvas value={qrCodeData} size={256} />
                            </Box>
                        </Box>
                    </Paper>
                )}
            </Container>
        </Box>
    );
}
