import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';

const timeFormat = (time) => String(time).padStart(2, '0');

const Main2_3_Calendar = () => {
  const [schedules, setSchedules] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [teamName, setTeamName] = useState('팀 로딩 중...');
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  
  // 마감 시간 상태 추가 (시: 09, 분: 00)
  const [dueDateHour, setDueDateHour] = useState('17'); 
  const [dueDateMinute, setDueDateMinute] = useState('00'); 
  
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchUserTeam = async () => {
      const userRef = doc(db, 'users', user.uid);
      try {
        const docSnap = await getDoc(userRef);
        const currentTeamId = docSnap.data()?.teamId;

        if (!currentTeamId) {
          alert('팀 정보가 없습니다. 팀 설정 페이지로 이동합니다.');
          navigate('/main1/team-setup');
          return;
        }
        setTeamId(currentTeamId);

        const teamSnap = await getDoc(doc(db, 'teams', currentTeamId));
        if (teamSnap.exists()) {
            setTeamName(teamSnap.data().name);
        } else {
            setTeamName('팀 이름 없음');
        }
      } catch (error) {
        console.error("팀 정보 로드 실패:", error);
      }
    };
    fetchUserTeam();
  }, [user, navigate]);

  useEffect(() => {
    if (!teamId) return;

    const q = query(collection(db, 'schedules'), where('teamId', '==', teamId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSchedules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSchedules(fetchedSchedules);
    }, (error) => {
      console.error("일정 불러오기 실패:", error);
    });

    return unsubscribe;
  }, [teamId]);

  // 일정 추가 로직
  const addSchedule = async () => {
    if (!newScheduleTitle || !selectedDate) return alert('일정 내용과 날짜를 입력해주세요.');
    if (!teamId) return alert('팀 정보를 로드 중입니다.');
    
    // 마감 기한 문자열 조합 (YYYY-MM-DD HH:MM)
    const dueTime = `${timeFormat(dueDateHour)}:${timeFormat(dueDateMinute)}`;

    try {
      await addDoc(collection(db, 'schedules'), {
        teamId,
        title: newScheduleTitle,
        date: selectedDate, 
        dueDate: dueTime, // ✅ 마감 시간 필드 추가
        creatorId: user.uid,
        createdAt: new Date(),
      });
      setNewScheduleTitle('');
      alert('일정이 추가되었습니다.');
    } catch (error) {
      alert('일정 추가 실패: ' + error.message);
    }
  };

  // 일정 삭제 로직
  const deleteSchedule = async (scheduleId) => {
    // ⚠️ window.confirm 대신 커스텀 모달 UI를 사용하는 것이 좋습니다.
    if (!window.confirm('정말로 이 일정을 삭제하시겠습니까?')) return; 
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
      alert('일정이 삭제되었습니다.');
    } catch (error) {
      alert('일정 삭제 실패: ' + error.message);
    }
  };

  const schedulesForSelectedDate = schedules
    .filter(s => s.date === selectedDate)
    .sort((a, b) => (a.dueDate || '23:59').localeCompare(b.dueDate || '23:59')); // 마감 기한 순으로 정렬

  const dateStyle = {
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginRight: '10px',
  };

  const buttonStyle = (color) => ({
    padding: '10px 20px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.3s',
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.headerTitle}>{teamName} 팀 캘린더</h2>
      
      {/* 캘린더 영역 (Placeholder) */}
      <div style={styles.calendarSection}>
        <h3 style={styles.calendarHeader}>📅 일정 확인 및 추가</h3>
        <div style={styles.datePickerContainer}>
          <p style={{ fontWeight: 'bold' }}>선택 날짜:</p>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            style={dateStyle}
          />
        </div>
      </div>

      {/* 일정 추가 영역 */}
      <div style={styles.scheduleAddSection}>
        <h3 style={styles.sectionTitle}>✅ 새 일정 등록</h3>
        <input 
          type="text" 
          value={newScheduleTitle} 
          onChange={(e) => setNewScheduleTitle(e.target.value)} 
          placeholder="일정 내용" 
          style={styles.input}
        />
        <div style={styles.timeInputContainer}>
          <span style={{ marginRight: '10px' }}>마감 기한:</span>
          <select value={dueDateHour} onChange={(e) => setDueDateHour(e.target.value)} style={styles.select}>
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={timeFormat(i)}>{timeFormat(i)}시</option>
            ))}
          </select>
          <select value={dueDateMinute} onChange={(e) => setDueDateMinute(e.target.value)} style={styles.select}>
            {Array.from({ length: 60 / 5 }).map((_, i) => (
              <option key={i} value={timeFormat(i * 5)}>{timeFormat(i * 5)}분</option>
            ))}
          </select>
          <button onClick={addSchedule} style={buttonStyle('#3498db')}>
            일정 등록
          </button>
        </div>
      </div>

      {/* 일정 목록 영역 */}
      <div style={styles.scheduleListSection}>
        <h3 style={styles.sectionTitle}>🗓️ {selectedDate} 일정 목록 ({schedulesForSelectedDate.length}건)</h3>
        <ul style={styles.list}>
          {schedulesForSelectedDate.length > 0 ? (
            schedulesForSelectedDate.map(schedule => (
              <li key={schedule.id} style={styles.listItem}>
                <div style={styles.scheduleContent}>
                  <span style={styles.scheduleTime}>
                    [~{schedule.dueDate || '시간 미지정'}]
                  </span>
                  {schedule.title}
                </div>
                <div style={styles.scheduleMeta}>
                  <span style={styles.creatorId}>
                    작성자: {schedule.creatorId.substring(0, 4)}...
                  </span>
                  <button 
                    onClick={() => deleteSchedule(schedule.id)} 
                    style={styles.deleteButton}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li style={styles.noSchedule}>해당 날짜에 일정이 없습니다.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

const styles = {
    container: {
      padding: '40px',
      maxWidth: '960px',
      margin: 'auto',
      backgroundColor: '#f7f9fc',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif', // 웹폰트 유지
    },
    headerTitle: {
      fontSize: '2em',
      color: '#2c3e50',
      marginBottom: '30px',
      borderBottom: '3px solid #3498db',
      paddingBottom: '10px',
    },
    // 캘린더 및 일정 확인 영역 (구 cardSection)
    calendarSection: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '25px',
      marginBottom: '30px',
    },
    calendarHeader: {
      color: '#2980b9',
      marginBottom: '20px',
    },
    datePickerContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '10px',
      backgroundColor: '#ecf0f1',
      borderRadius: '6px',
    },
    dateInput: { // 필수 키, 새로운 input 스타일에 맞춰 재정의
      padding: '10px 12px',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '1em',
      cursor: 'pointer',
      flexGrow: 1,
      maxWidth: '200px',
    },
    // 일정 추가 영역 (구 cardSection)
    scheduleAddSection: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '25px',
      marginBottom: '30px',
    },
    sectionTitle: {
      color: '#2c3e50',
      marginBottom: '15px',
      fontSize: '1.4em',
      fontWeight: '700', // 구 스타일에서 유지
      paddingBottom: '5px', // 구 스타일에서 유지
    },
    input: {
      padding: '12px',
      width: '100%',
      boxSizing: 'border-box',
      marginBottom: '15px',
      borderRadius: '4px',
      border: '1px solid #bdc3c7',
      fontSize: '1em',
      transition: 'border-color 0.2s',
    },
    select: {
      padding: '10px',
      marginRight: '10px',
      borderRadius: '4px',
      border: '1px solid #bdc3c7',
      fontSize: '1em',
      minWidth: '80px',
      cursor: 'pointer',
    },
    timeInputContainer: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px',
      marginBottom: '10px', // 구 스타일에서 유지
    },
    // 버튼 스타일 (primaryButton 키가 누락되어 새로운 테마 색상에 맞춰 추가)
    primaryButton: { 
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '12px 20px', 
      cursor: 'pointer',
      fontSize: '1em',
      fontWeight: '600',
      transition: 'background-color 0.3s',
      marginLeft: 'auto',
    },
    // 일정 목록 영역 (구 cardSection)
    scheduleListSection: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '25px',
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0, // 구 스타일에서 유지
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 10px',
      backgroundColor: '#fefefe', // 목록 항목 시각적 분리를 위해 추가
      borderRadius: '6px', // 목록 항목 시각적 분리를 위해 추가
      marginBottom: '8px', // 간격 조정을 위해 추가
      border: '1px solid #ecf0f1', // 목록 항목 테두리 추가
      transition: 'background-color 0.2s',
    },
    scheduleContent: {
      fontWeight: '500',
      color: '#34495e',
      flexGrow: 1,
      display: 'flex', // 구 스타일에서 유지
      alignItems: 'center', // 구 스타일에서 유지
    },
    scheduleTime: {
      color: '#e74c3c',
      fontWeight: 'bold',
      marginRight: '15px',
      fontSize: '0.9em', // 구 스타일에서 유지
    },
    scheduleMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    creatorId: {
      fontSize: '0.8em',
      color: '#7f8c8d',
      backgroundColor: '#f4f4f4', // 배경 추가
      padding: '4px 8px', // 패딩 추가
      borderRadius: '4px', // 둥근 모서리 추가
    },
    deleteButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9em',
      fontWeight: '600', // 구 스타일에서 유지
      transition: 'background-color 0.3s',
    },
    noSchedule: {
      textAlign: 'center',
      padding: '20px',
      color: '#7f8c8d',
      backgroundColor: '#fff', // 배경 추가
      borderRadius: '8px', // 둥근 모서리 추가
    }
  };

export default Main2_3_Calendar;