import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth'; 
import { doc, updateDoc } from 'firebase/firestore'; 

const Header = () => {
  const navigate = useNavigate();

  // ⭐ [수정됨] auth.currentUser를 직접 사용하여 실시간 인증 상태를 반영합니다.
  const user = auth.currentUser; 

  // 1. 상태 업데이트 로직 (5분마다 접속 상태 업데이트)
  useEffect(() => {
    if (!auth || !db) return;

    const updateActiveStatus = async () => {
      // ⭐ [수정됨] auth.currentUser를 직접 참조
      if (auth.currentUser) {
        try {
          // Firestore의 lastActive 필드를 현재 시간으로 업데이트
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            lastActive: new Date(),
          });
        } catch (error) {
          console.error("접속 상태 업데이트 실패:", error);
        }
      }
    };
    
    // 컴포넌트 마운트 시 최초 실행, 이후 5분마다 반복
    updateActiveStatus(); 
    const intervalId = setInterval(updateActiveStatus, 300000); // 5분 = 300000ms

    // onAuthStateChanged 로직 제거
    return () => {
      clearInterval(intervalId); // 클리어
    };
  }, []); 

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert('로그아웃되었습니다.');
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 나머지 JSX는 user 상태에 따라 렌더링됩니다.
  return (
    <header style={styles.container}>
      <Link to={user ? "/main2/calendar" : "/"} style={styles.logo}>
        🗓️ 팀 캘린더
      </Link>
      
      <nav style={styles.nav}>
        {user && (
          // 로그인 상태일 때
          <>
            <span style={styles.userInfo}>
                {/* user.email을 사용하여 표시 */}
                {user.email}님 환영합니다!
            </span>
            <Link to="/main2/calendar" style={styles.navLink}>
              캘린더
            </Link>
            <Link to="/main4/team-manage" style={styles.navLink}>
              팀 관리
            </Link>
            <button 
              onClick={handleLogout} 
              style={{...styles.navLink, ...styles.logoutButton}}
            >
              로그아웃
            </button>
          </>
        )}
        {!user && (
          // 로그아웃 상태일 때
          <>
            <Link to="/login" style={styles.navLink}>
              로그인
            </Link>
            <Link to="/register" style={{...styles.navLink, ...styles.registerLink}}>
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

// 간단한 인라인 스타일
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 30px',
    backgroundColor: 'white', 
    color: '#333',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logo: {
    color: '#0070c0', 
    textDecoration: 'none',
    fontSize: '1.4em',
    fontWeight: '700',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    marginRight: '10px',
    fontSize: '0.9em',
    color: '#777',
  },
  navLink: {
    color: '#555',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    padding: '8px 12px',
    transition: 'color 0.2s',
    fontWeight: '500',
    fontSize: '1em', 
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '8px',
    padding: '8px 15px',
    fontWeight: '600',
    marginLeft: '5px',
  },
  registerLink: {
    color: 'white',
    backgroundColor: '#0070c0', 
    textDecoration: 'none',
    padding: '8px 15px',
    borderRadius: '8px', 
    fontWeight: '600',
  },
};

export default Header;