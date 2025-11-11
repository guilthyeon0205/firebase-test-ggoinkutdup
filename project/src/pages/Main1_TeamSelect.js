// src/pages/Main1_TeamSelect.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ⭐ [수정] runTransaction을 import 합니다.
import { collection, doc, setDoc, updateDoc, getDoc, runTransaction } from 'firebase/firestore'; 
import { auth, db } from '../firebase/firebaseConfig';
import { v4 as uuidv4 } from 'uuid'; 

const Main1_TeamSelect = () => {
  const [teamName, setTeamName] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');
  const navigate = useNavigate();
  const user = auth.currentUser;

  // 1. 팀 생성 로직 (기존 로직 유지)
  const createTeam = async () => {
    if (!user || !teamName) return;
    const newTeamId = uuidv4(); // 고유한 팀 ID 생성
    try {
      // 1-1. teams 컬렉션에 새 팀 문서 생성
      await setDoc(doc(db, 'teams', newTeamId), {
        teamId: newTeamId,
        name: teamName,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: new Date(),
      });
      // 1-2. user 문서 업데이트 (이것은 트랜잭션 없이도 안전함)
      await updateDoc(doc(db, 'users', user.uid), {
        teamId: newTeamId,
      });

      alert(`팀 '${teamName}' 생성 및 가입 성공!`);
      navigate('/main2/calendar');
    } catch (error) {
      console.error("팀 생성 실패:", error);
      alert('팀 생성 실패: ' + error.message);
    }
  };

  // 2. 팀 가입 로직 (⭐⭐⭐ [핵심 수정] 트랜잭션 사용)
  const joinTeam = async () => {
    if (!user || !joinTeamId || !user.uid) {
        alert("로그인 정보가 유효하지 않습니다.");
        return;
    }

    // 참조 정의
    const teamRef = doc(db, 'teams', joinTeamId);
    const userRef = doc(db, 'users', user.uid);
    
    try {
      await runTransaction(db, async (transaction) => {
        // 1. 트랜잭션 내에서 팀 문서와 사용자 문서 읽기
        const teamSnap = await transaction.get(teamRef);
        const userSnap = await transaction.get(userRef);

        if (!teamSnap.exists()) {
          throw new Error('존재하지 않는 팀 ID입니다.'); 
        }

        const userData = userSnap.data();

        // 2. [Validation] 이미 팀에 가입되어 있는지 확인
        if (userData.teamId === joinTeamId) {
            // 이 경고는 트랜잭션 내부에서 throw하지 않고, 외부에서 처리해야 합니다.
            // 여기서는 트랜잭션을 중단하고 나가지만, 외부 catch 블록에서 처리할 메시지를 설정합니다.
            throw new Error('ALREADY_JOINED'); 
        }
        
        // 3. teams 문서 업데이트 (members 배열에 UID 추가)
        const currentMembers = teamSnap.data().members || [];
        if (!currentMembers.includes(user.uid)) {
          const newMembers = [...currentMembers, user.uid];
          // 트랜잭션 내에서 업데이트 예약
          transaction.update(teamRef, { members: newMembers }); 
        } else {
             // 이미 멤버 배열에 UID가 있는 경우 (users 문서만 업데이트하면 됨)
        }
        
        // 4. user 문서 업데이트 (teamId 설정)
        // 트랜잭션 내에서 업데이트 예약
        transaction.update(userRef, { teamId: joinTeamId });
      });

      // 트랜잭션 성공 시
      alert('팀에 성공적으로 가입했습니다.');
      navigate('/main2/calendar');

    } catch (error) {
        if (error.message.includes('존재하지 않는 팀 ID')) {
             alert('존재하지 않는 팀 ID입니다.');
        } else if (error.message === 'ALREADY_JOINED') {
             alert('이미 해당 팀에 가입되어 있습니다.');
             navigate('/main2/calendar'); // 이미 가입된 경우 캘린더로 이동
        }
        else {
             console.error("팀 가입 트랜잭션 실패:", error);
             alert('팀 가입 실패 (Firestore 권한 또는 네트워크 문제): ' + error.message);
        }
    }
  };

  // 3. UI 렌더링 부분 (기존 로직 유지)
  return (
    <div style={styles.container}>
      {/* 사용자 정보 로딩 체크 */}
      {/* 이 예제에서는 auth.currentUser를 바로 사용하므로, 실제 앱에서는 로딩 상태를 확인해야 합니다. */}
      {!user && <p style={styles.loadingText}>사용자 정보 로딩 중...</p>}

      {user && (
        <>
          <h2 style={styles.title}>팀 설정</h2>
          
          <div style={styles.section}>
            <h3 style={styles.subtitle}>팀 생성</h3>
            <p style={styles.description}>새로운 팀을 만들고 팀장이 됩니다.</p>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="새 팀 이름"
              style={styles.input}
            />
            <button onClick={createTeam} style={styles.createButton}>
              팀 생성 및 가입
            </button>
          </div>

          <div style={styles.section}>
            <h3 style={styles.subtitle}>팀 가입</h3>
            <p style={styles.description}>기존 팀의 ID를 입력하여 가입합니다.</p>
            <input
              type="text"
              value={joinTeamId}
              onChange={(e) => setJoinTeamId(e.target.value)}
              placeholder="팀 ID 입력"
              style={styles.input}
            />
            <button onClick={joinTeam} style={styles.joinButton}>
              팀 가입하기
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// 간단한 인라인 스타일 (CSS 파일 사용을 권장합니다.)
const styles = {
    container: {
        padding: '40px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f8f8f8',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginTop: '50px'
    },
    title: {
        fontSize: '2em',
        color: '#2c3e50',
        marginBottom: '30px',
    },
    section: {
        marginBottom: '30px',
        padding: '20px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff',
    },
    subtitle: {
        color: '#3498db',
        marginBottom: '15px',
        fontSize: '1.5em',
        fontWeight: 'bold',
    },
    description: {
        color: '#7f8c8d',
        marginBottom: '15px',
        fontSize: '0.9em'
    },
    input: {
        padding: '10px',
        marginRight: '10px',
        borderRadius: '4px',
        border: '1px solid #bdc3c7',
        width: 'calc(100% - 100px)',
        marginBottom: '15px'
    },
    createButton: {
        padding: '10px 20px',
        backgroundColor: '#2ecc71',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold',
        width: '100%'
    },
    joinButton: {
        padding: '10px 20px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold',
        width: '100%'
    },
    loadingText: {
        color: '#95a5a6',
        fontSize: '1.2em'
    }
};

export default Main1_TeamSelect;