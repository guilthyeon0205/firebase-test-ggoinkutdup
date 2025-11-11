// src/pages/RegisterPage.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase/firebaseConfig';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Firebase Authentication으로 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore 'users' 컬렉션에 초기 사용자 데이터 저장
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        teamId: null, // 초기에는 팀이 없으므로 null
        lastActive: new Date(), // 현재 접속 상태 확인을 위한 필드
      });
      
      alert("회원가입 성공! 팀 설정 페이지로 이동합니다.");
      // 회원가입 성공 후 메인 페이지 1 (팀 설정)으로 이동
      navigate('/main1/team-setup', { replace: true }); 
      
    } catch (err) {
      console.error("회원가입 실패:", err.code, err.message);
      let errorMessage = "회원가입에 실패했습니다. 다시 시도해주세요.";
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일 주소입니다.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = '비밀번호는 6자리 이상이어야 합니다.';
      }
      setError(errorMessage);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>회원가입</h2>
      <form onSubmit={handleRegister} style={styles.form}>
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
          placeholder="비밀번호 (6자리 이상)" 
          required 
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          회원가입 완료
        </button>
      </form>

      <p style={styles.loginText}>
        이미 계정이 있으신가요? 
        <Link to="/login" style={styles.loginLink}>로그인</Link>
      </p>
    </div>
  );
};

// 인라인 스타일 (LoginPage와 유사하게)
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
    backgroundColor: '#2ecc71', // Register 버튼은 다른 색상으로
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
  loginText: {
    marginTop: '20px',
    color: '#7f8c8d',
  },
  loginLink: {
    marginLeft: '5px',
    color: '#3498db',
    textDecoration: 'none',
    fontWeight: 'bold',
  }
};

export default RegisterPage;