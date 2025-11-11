import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext'; // (선택적) 전역 인증 상태 관리
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header'; // 모든 메인 페이지에 공통 헤더 적용

// 페이지 컴포넌트 임포트
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Main1_TeamSelect from './pages/Main1_TeamSelect';
import Main2_3_Calendar from './pages/Main2_3_Calendar';
import Main4_TeamManage from './pages/Main4_TeamManage';

function App() {
  return (
    <Router>
      {/* <AuthProvider> */} 
        <Routes>
          {/* 퍼블릭 페이지 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* ✅ 오류 수정: element 속성에 컴포넌트를 올바른 JSX 형태로 전달 */}
          <Route path="/register" element={<RegisterPage />} /> 

          {/* 보호된 페이지 (로그인 필수) */}
          {/* ✅ 개선: PrivateRoute 내부에서 Header와 메인 콘텐츠를 함께 렌더링하도록 수정 */}
          <Route 
            path="/main1/team-setup" 
            element={<PrivateRoute element={<><Header /><Main1_TeamSelect /></>} />} 
          />
          <Route 
            path="/main2/calendar" 
            element={<PrivateRoute element={<><Header /><Main2_3_Calendar /></>} />} 
          />
          <Route 
            path="/main4/team-manage" 
            element={<PrivateRoute element={<><Header /><Main4_TeamManage /></>} />} 
          />
        </Routes>
      {/* </AuthProvider> */}
    </Router>
  );
}

export default App;
