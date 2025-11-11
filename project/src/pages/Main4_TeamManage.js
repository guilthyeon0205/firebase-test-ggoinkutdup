import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    onAuthStateChanged,
} from 'firebase/auth';
import { 
    collection, doc, onSnapshot, arrayRemove, updateDoc, getDoc,
} from 'firebase/firestore';

// ⭐ [중요] 초기화된 인스턴스만 가져옵니다.
import { auth, db } from '../firebase/firebaseConfig'; 

// =========================================================================
// 1. Firebase 설정 및 유틸리티
// =========================================================================

const getTeamCollectionRef = () => {
    return collection(db, 'teams');
};

const AlertModal = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full transform transition-all scale-100 border-t-4 border-red-500">
                <h3 className="text-xl font-bold text-red-600 mb-3">
                    [경고] 알림
                </h3>
                <p className="text-gray-700 mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

// =========================================================================
// 2. 메인 컴포넌트 이름: App
// =========================================================================
export default function App() {
    const [user, setUser] = useState(null);
    const [team, setTeam] = useState(null);
    const [userTeamId, setUserTeamId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null); 
    const [memberDetails, setMemberDetails] = useState({}); 
    
    const navigate = useNavigate();
    const currentUserId = user?.uid || 'N/A';
    
    // 3. Auth State Observer
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
                setLoading(false);
                navigate('/login', { replace: true });
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]); 

    // 4. 사용자 문서에서 Team ID를 조회하는 로직 (로딩 안정화)
    useEffect(() => {
        if (!user || !db || !user.uid) { 
            setLoading(false); 
            return;
        }

        const fetchUserTeamId = async () => {
            const userRef = doc(db, 'users', user.uid);
            try {
                const docSnap = await getDoc(userRef);
                if (docSnap.exists() && docSnap.data().teamId) {
                    setUserTeamId(docSnap.data().teamId);
                } else {
                    if (!docSnap.exists() || docSnap.data().teamId === null) {
                        alert('속한 팀 정보가 없습니다. 팀 설정 페이지로 이동합니다.');
                        navigate('/main1/team-setup', { replace: true });
                        return;
                    }
                }
            } catch (e) {
                console.error("사용자 팀 ID 조회 실패:", e);
                setError(`사용자 데이터 조회 오류: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchUserTeamId();
    }, [user, navigate]); 

    // 5. Team Data Listener Effect (팀 문서 실시간 구독)
    useEffect(() => {
        if (!db || !userTeamId) return; 
        
        const teamDocRef = doc(getTeamCollectionRef(), userTeamId); 

        const unsubscribeTeam = onSnapshot(teamDocRef, 
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    setTeam(docSnapshot.data());
                    console.log(`Team data updated for ${userTeamId}.`);
                } else {
                    console.log("Team document does not exist. Redirecting.");
                    setTeam(null);
                    alert('현재 속해 있던 팀이 삭제되었습니다. 팀 설정 페이지로 이동합니다.');
                    navigate('/main1/team-setup', { replace: true });
                }
            }, 
            (e) => {
                console.error("Error fetching team data:", e);
                setError(`팀 데이터 가져오기 오류: ${e.message}.`); 
            }
        );

        return () => unsubscribeTeam();
    }, [userTeamId, navigate]); 

    // 5-1. 멤버 UID로 이메일/닉네임 상세 정보를 가져오는 Effect (핵심 수정)
    useEffect(() => {
        if (!team || !userTeamId) {
            setMemberDetails({});
            return;
        }

        const currentMembers = team.members || [];
        if (currentMembers.length === 0) {
             setMemberDetails({});
             return;
        }
        
        const fetchMemberDetails = async () => {
            const details = {};
            const fetchPromises = currentMembers.map(async (uid) => {
                if (typeof uid !== 'string' || uid.length < 5) return; 

                const userRef = doc(db, 'users', uid);
                try {
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        details[uid] = { email: docSnap.data().email }; 
                    } else {
                        details[uid] = { email: '사용자 정보 없음' };
                    }
                } catch (e) {
                    console.error(`Failed to fetch user ${uid} details:`, e);
                    details[uid] = { email: `[권한 오류] ${uid}` }; 
                }
            });
            
            await Promise.all(fetchPromises);
            setMemberDetails(details);
        };
        
        fetchMemberDetails();
    }, [team?.members, userTeamId]); // team.members 배열이 변경될 때마다 확실하게 재실행

    const isMember = useMemo(() => team?.members?.includes(user?.uid), [team, user]);
    const isOwner = user?.uid === team?.ownerId; 

    // 6. 🏃‍♂️ 팀 나가기 핸들러 
    const handleJoinLeave = useCallback(async () => {
        if (!db || !user || isProcessing || !team || !userTeamId) return;
        setIsProcessing(true);
        const teamDocRef = doc(getTeamCollectionRef(), userTeamId);
        
        try {
            if (isMember) {
                if (isOwner) {
                    setAlertMessage("팀 소유자는 팀 나가기 버튼으로 나갈 수 없습니다. 소유권을 다른 팀원에게 이전하거나 팀을 삭제해야 합니다.");
                    setIsProcessing(false);
                    return;
                }
                
                if (team.members.length === 1) {
                    setAlertMessage("팀의 마지막 멤버입니다. 팀을 나갈 수 없습니다."); 
                    setIsProcessing(false);
                    return;
                }
                
                // 3. 팀 나가기 실행 (팀 문서에서 제거)
                await updateDoc(teamDocRef, {
                    members: arrayRemove(user.uid)
                });
                // 4. 사용자 문서의 teamId 필드 초기화
                await updateDoc(doc(db, 'users', user.uid), {
                    teamId: null
                });
                
                alert("팀에서 성공적으로 나갔습니다. 팀 설정 페이지로 이동합니다.");
                navigate('/main1/team-setup', { replace: true });
                
            } else {
                setAlertMessage("팀 가입은 '팀 설정' 페이지에서 진행해 주세요.");
            }
        } catch (e) {
            console.error("팀 나가기 실패:", e);
            setError(`팀 나가기 실패: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [isMember, isProcessing, team, user, isOwner, userTeamId, navigate]);

    // 7. ❌ 팀 멤버 삭제 핸들러 (소유자 전용)
    const handleRemoveMember = useCallback(async (memberUid) => {
        if (!db || !user || isProcessing || !team || !userTeamId) return;
        
        // 1. Owner Check
        if (!isOwner) {
            setAlertMessage("팀 멤버를 삭제할 권한이 없습니다. (팀 소유자만 가능)");
            return;
        }
        
        // 2. Self-removal check (소유자 자신은 삭제 불가능)
        if (memberUid === user.uid) { 
            setAlertMessage("자신은 멤버 삭제 버튼으로 제거할 수 없습니다.");
            return;
        }
        
        setIsProcessing(true);
        const teamDocRef = doc(getTeamCollectionRef(), userTeamId);
        
        try {
            // 3. 팀 문서에서 멤버 제거
            await updateDoc(teamDocRef, {
                members: arrayRemove(memberUid)
            });
            // 4. 해당 사용자 문서의 teamId 필드 초기화 (필수)
             await updateDoc(doc(db, 'users', memberUid), {
                teamId: null
            });
            
            console.log(`Member ${memberUid} removed by owner.`);
        } catch (e) {
            console.error("Member removal failed:", e);
            setError(`팀 멤버 삭제 실패: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [user, isProcessing, team, isOwner, userTeamId]); 

    // --- UI Rendering Functions ---

    const renderLoadingState = () => (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-xl font-semibold text-gray-700">팀 정보 로딩 중...</p>
        </div>
    );
    
    const renderErrorState = () => (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl shadow-lg border border-red-200 text-center p-6 w-full max-w-xl">
            <p className="w-8 h-8 text-red-600 text-3xl font-bold mb-4">!</p>
            <p className="font-bold text-red-800">Firestore 접근 오류:</p>
            <p className="text-sm text-red-600 mt-1 break-all max-w-full overflow-hidden">{error}</p>
            <p className="text-xs text-red-500 mt-3">
                * 이 오류는 **Firestore 보안 규칙** 문제일 가능성이 높습니다.
            </p>
        </div>
    );

    const renderTeamManagement = () => {
        if (!team) {
            return (
                 <div className="p-8 bg-white rounded-2xl shadow-xl w-full max-w-xl text-center border-t-4 border-red-500">
                    <h1 className="text-2xl font-extrabold text-red-700 mb-2">팀 정보를 찾을 수 없습니다.</h1>
                    <p className="text-gray-600">사용자 문서 ({currentUserId})에 연결된 팀 ID: <span className="font-mono text-red-600">{userTeamId || 'N/A'}</span></p>
                    <p className="text-sm text-gray-500 mt-4">
                        팀이 삭제되었거나, 사용자 문서의 정보가 잘못되었습니다. 잠시 후 팀 설정 페이지로 이동합니다.
                    </p>
                </div>
            )
        }
        
        return (
            <div className="p-8 bg-white rounded-2xl shadow-2xl w-full max-w-xl">
                <header className="border-b pb-4 mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-indigo-700">
                        🤝 {team.name}
                    </h1>
                    {isOwner && (
                        <span className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold shadow-md">
                            팀 소유자 관리 모드
                        </span>
                    )}
                </header>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">나의 사용자 ID:</p>
                    <p className="font-mono text-base text-gray-900 break-all">
                        {currentUserId}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        팀 ID: <span className="font-mono text-indigo-600">{userTeamId}</span>
                    </p>
                </div>
    
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-between items-center">
                    팀 멤버 ({team?.members?.length || 0}명)
                </h2>
    
                <ul className="space-y-2 mb-8 max-h-72 overflow-y-auto pr-2">
                    {team?.members?.length > 0 ? (
                        team.members.map(uid => (
                            <li key={uid} className={`flex justify-between items-center p-3 rounded-xl transition-all border ${uid === user?.uid ? 'bg-green-50 border-green-300 font-bold shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                                <div className="flex flex-col items-start min-w-0">
                                    {/* 이메일(닉네임) 표시 */}
                                    <span className="text-sm truncate text-gray-800 font-semibold">
                                        {memberDetails[uid]?.email || '정보 로딩 중...'} 
                                    </span>
                                    {/* UID는 작게 표시 */}
                                    <span className="font-mono text-xs text-gray-500 truncate mt-0.5">
                                        UID: {uid}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0"> 
                                    {/* 소유자/나 뱃지 */}
                                    {uid === team.ownerId && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500 text-white font-bold">Owner</span>
                                    )}
                                    {uid === user?.uid && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500 text-white">나</span>
                                    )}
                                    {/* ❌ 팀원 삭제 버튼 */}
                                    {isOwner && uid !== user?.uid && (
                                        <button
                                            onClick={() => handleRemoveMember(uid)}
                                            disabled={isProcessing}
                                            className="text-xs px-3 py-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition duration-150 disabled:opacity-50 shadow-md"
                                            title={`${memberDetails[uid]?.email || uid}를 팀에서 제외`}
                                        >
                                            ❌ 삭제
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            팀에 멤버가 없습니다.
                        </li>
                    )}
                </ul>
    
                {/* 🏃‍♂️ 팀 나가기 버튼 */}
                <button
                    onClick={handleJoinLeave}
                    disabled={isProcessing || !user || isOwner}
                    className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 flex items-center justify-center ${
                        isOwner
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isOwner ? "소유자는 팀을 나갈 수 없습니다." : "팀에서 완전히 나갑니다."}
                >
                    {isProcessing ? (
                        <span className="flex items-center">
                            <span className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            처리 중...
                        </span>
                    ) : (
                        isOwner ? '팀 소유자는 나갈 수 없음' : '팀 나가기 (팀 설정 페이지로 이동)'
                    )}
                </button>
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-['Inter']">
            {/* 메인 UI */}
            {loading ? renderLoadingState() : 
             error ? renderErrorState() : 
             renderTeamManagement()}

            {/* 커스텀 알림 모달 */}
            <AlertModal 
                message={alertMessage} 
                onClose={() => setAlertMessage(null)} 
            />
        </div>
    );
}