// src/pages/LoginPage.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase/firebaseConfig';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // 오류 메시지 초기화
    
    try {
      // 1. Firebase Authentication으로 로그인 시도
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore에서 사용자 정보(teamId) 확인
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      let redirectPath = '/main2/calendar'; // 기본 리디렉션 경로 (메인 캘린더)

      if (docSnap.exists() && docSnap.data().teamId === null) {
        // 팀 정보가 없으면 팀 설정 페이지로 이동
        redirectPath = '/main1/team-setup';
      } 
      
      // 3. 리디렉션
      alert("로그인 성공!");
      navigate(redirectPath, { replace: true });

    } catch (err) {
      console.error("로그인 실패:", err.code, err.message);
      let errorMessage = "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.";
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = '해당 이메일로 등록된 사용자가 없습니다.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.';
      }
      setError(errorMessage);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>로그인</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        {error && <p style={styles.error}>{error}</p>}
        
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="이메일" 
          required 
          style={styles.input}
        />
        
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="비밀번호" 
          required 
          style={styles.input}
        />
        
        <button type="submit" style={styles.button}>
          로그인
        </button>
      </form>
      
      <p style={styles.registerText}>
        계정이 없으신가요? 
        <Link to="/register" style={styles.registerLink}>회원가입</Link>
      </p>
    </div>
  );
};

// 간단한 인라인 스타일
const styles = {
  container: {
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
    margin: '100px auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  title: {
    marginBottom: '20px',
    color: '#2c3e50',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '4px',
    border: '1px solid #bdc3c7',
  },
  button: {
    padding: '12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.3s',
  },
  error: {
    color: 'red',
    marginBottom: '15px',
  },
  registerText: {
    marginTop: '20px',
    color: '#7f8c8d',
  },
  registerLink: {
    marginLeft: '5px',
    color: '#2ecc71',
    textDecoration: 'none',
    fontWeight: 'bold',
  }
};

export default LoginPage;