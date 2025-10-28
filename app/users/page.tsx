// 회원 목록 페이지
// Firebase Realtime Database에서 모든 사용자의 정보를 조회하여 목록으로 표시합니다.
// 사용자를 클릭하면 1:1 채팅방으로 이동할 수 있습니다.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getAllUsers } from "@/lib/user";

// 사용자 정보 타입 정의
interface UserInfo {
  uid: string;
  displayName?: string;
  email?: string;
  createdAt?: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 컴포넌트 마운트 시 모든 사용자 정보 조회
  useEffect(() => {
    async function fetchUsers() {
      try {
        setError("");
        // Firebase Realtime Database에서 모든 사용자 정보 조회
        // 경로: /vibe/users
        const allUsersData = await getAllUsers();

        if (allUsersData) {
          // 조회한 데이터를 배열로 변환
          const userArray: UserInfo[] = Object.entries(allUsersData).map(
            ([uid, userData]) => ({
              uid,
              displayName: userData.displayName || "이름 없음",
              email: userData.email,
              createdAt: userData.createdAt,
            })
          );

          // displayName으로 정렬
          userArray.sort((a, b) =>
            (a.displayName || "").localeCompare(b.displayName || "", "ko-KR")
          );

          setUsers(userArray);
        } else {
          setUsers([]);
        }
      } catch (err: any) {
        setError(err.message || "사용자 목록을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // 현재 로그인한 사용자 정보 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">회원 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">회원 목록</h1>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            오류가 발생했습니다: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">회원 목록</h1>
          <p className="text-muted-foreground mt-2">현재 등록된 회원 정보입니다.</p>
        </div>

        {/* 회원 수 표시 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <strong>총 회원 수: {users.length}명</strong>
          </p>
        </div>

        {/* 회원이 없을 경우 */}
        {users.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">등록된 회원이 없습니다.</p>
          </div>
        ) : (
          // 회원 목록을 테이블로 표시
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">이름</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">UID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">이메일</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  // 현재 사용자와 다른 사용자인지 확인
                  const isCurrentUser = currentUserId === user.uid;
                  const isClickable = !isCurrentUser;

                  return (
                    <tr
                      key={user.uid}
                      onClick={() => {
                        // 현재 사용자가 아닌 경우만 채팅방으로 이동
                        if (isClickable) {
                          router.push(`/chat/room?otherId=${user.uid}`);
                        }
                      }}
                      className={`border-b border-slate-200 transition-colors ${
                        isCurrentUser
                          ? "bg-slate-50 opacity-60"
                          : isClickable
                          ? "bg-white hover:bg-slate-50 cursor-pointer"
                          : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <strong className="text-foreground">{user.displayName}</strong>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-muted-foreground">
                          {user.uid.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {user.email ? (
                          <a href={`mailto:${user.email}`} className="text-sm text-blue-600 hover:underline">
                            {user.email}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 데이터 설명 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">📍 데이터 저장 위치:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Firebase Realtime Database: <code className="bg-white px-1 py-0.5 rounded text-xs">/vibe/users/&lt;uid&gt;</code></li>
            <li>조회 시마다 최신 데이터를 불러옵니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
