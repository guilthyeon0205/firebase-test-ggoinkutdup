// src/firebase/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // 인증 (로그인, 회원가입)
import { getFirestore } from 'firebase/firestore'; // 데이터베이스 (팀, 일정, 사용자 정보)

// TODO: 본인의 Firebase 프로젝트 설정으로 대체해야 합니다.
// ⭐ 수정: export 키워드를 제거하여 객체를 이 파일 내에서만 사용합니다.
const firebaseConfig = { 
  apiKey: "AIzaSyAx8Z1mBqNJeu9zMekif6ZapoySuan_ZJo",
  authDomain: "project-ggoinkutdupkamkwanggel.firebaseapp.com",
  projectId: "project-ggoinkutdupkamkwanggel",
  storageBucket: "project-ggoinkutdupkamkwanggel.firebasestorage.app",
  messagingSenderId: "24989542673",
  appId: "1:24989542673:web:043379db7af81fd9d7c4b0"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 서비스 인스턴스 내보내기 (이것만 필요합니다)
export const auth = getAuth(app);
export const db = getFirestore(app);

// 현재 로그인 상태 확인을 위한 Auth Observer
// onAuthStateChanged(auth, (user) => {
//   // 사용자 상태 변경 시 로직 처리
// });