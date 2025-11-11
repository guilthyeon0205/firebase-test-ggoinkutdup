// src/pages/LandingPage.js

import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🗓️ 팀 캘린더 프로젝트</h1>
      </header>
      
      <section style={styles.introSection}>
        <h2 style={styles.subtitle}>팀 협업을 위한 간편한 일정 관리</h2>
        <p style={styles.description}>
          우리 팀의 일정을 한눈에 확인하고, 손쉽게 추가 및 삭제할 수 있는 팀 전용 캘린더 서비스입니다.
        </p>
        <div style={styles.description}>
          <ul>
            <li>팀원끼리 열람 할 수 있는 팀 캘린더</li>
            <li>팀워크를 혁신하는 캘린더</li>
          </ul>
        </div>
      </section>

      <div style={styles.authButtons}>
        <Link to="/login" style={{ ...styles.button, ...styles.loginButton }}>
          로그인
        </Link>
        <Link to="/register" style={{ ...styles.button, ...styles.registerButton }}>
          회원가입
        </Link>
      </div>
    </div>
  );
};

// 간단한 인라인 스타일 (CSS 파일 사용을 권장합니다.)
const styles = {
  container: {
    padding: '40px',
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '2.5em',
    color: '#2c3e50',
  },
  introSection: {
    marginBottom: '50px',
    padding: '20px',
    border: '1px solid #ecf0f1',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  subtitle: {
    color: '#3498db',
    marginBottom: '15px',
  },
  description: {
    lineHeight: '1.6',
    color: '#7f8c8d',
    textAlign: 'left',
  },
  authButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  button: {
    padding: '12px 30px',
    textDecoration: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    color: 'white',
  },
  loginButton: {
    backgroundColor: '#2ecc71',
  },
  registerButton: {
    backgroundColor: '#3498db',
  }
};

export default LandingPage;