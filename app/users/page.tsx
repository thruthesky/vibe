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
      <div className="relative min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.3),transparent_60%)]" />
        <p className="relative text-sm text-[#5d6472]">회원 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <div className="relative min-h-screen bg-[#f0f2f5] p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.3),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-[#050505]">회원 목록</h1>
          <div className="rounded-3xl border border-[#f28b82] bg-[#fdecea] p-4 text-sm text-[#b3261e] shadow-xl shadow-[#f5d4d0]/50 backdrop-blur">
            오류가 발생했습니다: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f0f2f5] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.3),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl space-y-6">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#050505]">회원 목록</h1>
          <p className="mt-2 text-sm text-[#5d6472]">현재 등록된 회원 정보를 확인하고 채팅을 시작하세요.</p>
        </div>

        {/* 회원 수 표시 */}
        <div className="rounded-3xl border border-white/60 bg-white/95 p-4 shadow-xl shadow-[#ccd9f0]/45 backdrop-blur">
          <p className="text-sm text-[#5d6472]">
            <strong className="text-[#050505]">총 회원 수: {users.length}명</strong>
          </p>
        </div>

        {/* 회원이 없을 경우 */}
        {users.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/95 p-8 text-center text-sm text-[#5d6472] shadow-xl shadow-[#ccd9f0]/45 backdrop-blur">
            등록된 회원이 없습니다.
          </div>
        ) : (
          // 회원 목록을 테이블로 표시
          <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/95 shadow-xl shadow-[#ccd9f0]/45 backdrop-blur">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#dfe1e6] bg-[#f5f6f7]">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#5d6472]">
                    이름
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#5d6472]">
                    UID
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#5d6472]">
                    이메일
                  </th>
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
                      className={`border-b border-[#f0f2f5] text-sm transition-all last:border-transparent ${
                        isCurrentUser
                          ? "bg-[#f5f6f7] opacity-75"
                          : isClickable
                          ? "cursor-pointer hover:-translate-y-[1px] hover:bg-[#eef2f9] hover:shadow-md hover:shadow-[#dce5f7]/60"
                          : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <strong className="text-[#050505]">{user.displayName}</strong>
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-[#f0f2f5] px-2 py-1 text-xs text-[#5d6472] shadow-inner shadow-white">
                          {user.uid.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {user.email ? (
                          <a
                            href={`mailto:${user.email}`}
                            className="text-sm font-medium text-[#1877f2] hover:underline"
                          >
                            {user.email}
                          </a>
                        ) : (
                          <span className="text-sm text-[#5d6472]">-</span>
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
        <div className="rounded-2xl border border-[#e4e6eb] bg-white p-4 text-sm text-[#65676b] shadow-sm space-y-2">
          <p className="font-semibold text-[#050505]">📍 데이터 저장 위치:</p>
          <ul className="space-y-1 text-[#65676b]">
            <li>
              Firebase Realtime Database:{" "}
              <code className="rounded bg-[#f0f2f5] px-1 py-0.5 text-xs text-[#050505]">
                /vibe/users/&lt;uid&gt;
              </code>
            </li>
            <li>조회 시마다 최신 데이터를 불러옵니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
