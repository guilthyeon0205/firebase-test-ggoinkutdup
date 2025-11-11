// src/components/PrivateRoute.js

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const PrivateRoute = ({ element }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Firebase 인증 상태 변경 관찰
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user); // user 객체가 있으면 true
      setLoading(false);
    });

    return unsubscribe; // 컴포넌트 언마운트 시 관찰 해제
  }, []);

  if (loading) {
    // 로딩 중 (인증 상태 확인 중)
    return <div>로딩 중...</div>; 
  }

  // 인증되었으면 요청한 컴포넌트 렌더링, 아니면 로그인 페이지로 리디렉션
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

export default PrivateRoute;