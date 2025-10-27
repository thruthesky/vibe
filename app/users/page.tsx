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
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>회원 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>회원 목록</h1>
        <div
          style={{
            color: "white",
            backgroundColor: "#dc3545",
            padding: "1rem",
            borderRadius: "4px",
          }}
        >
          오류가 발생했습니다: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>회원 목록</h1>
      <p>현재 등록된 회원 정보입니다.</p>

      {/* 회원 수 표시 */}
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#e9ecef",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      >
        <strong>총 회원 수: {users.length}명</strong>
      </div>

      {/* 회원이 없을 경우 */}
      {users.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          <p>등록된 회원이 없습니다.</p>
        </div>
      ) : (
        // 회원 목록을 테이블로 표시
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #ddd",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#007bff", color: "white" }}>
                <th style={{ padding: "1rem", textAlign: "left", border: "1px solid #ddd" }}>
                  이름
                </th>
                <th style={{ padding: "1rem", textAlign: "left", border: "1px solid #ddd" }}>
                  UID
                </th>
                <th style={{ padding: "1rem", textAlign: "left", border: "1px solid #ddd" }}>
                  이메일
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
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
                  style={{
                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                    cursor: isClickable ? "pointer" : "default",
                    opacity: isCurrentUser ? 0.6 : 1,
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (isClickable) {
                      e.currentTarget.style.backgroundColor = "#e9ecef";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? "#f9f9f9" : "white";
                  }}
                >
                  {/* 사용자 이름 (displayName) */}
                  <td style={{ padding: "1rem", border: "1px solid #ddd" }}>
                    <strong>{user.displayName}</strong>
                  </td>

                  {/* 사용자 UID */}
                  <td style={{ padding: "1rem", border: "1px solid #ddd" }}>
                    <code style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>
                      {user.uid}
                    </code>
                  </td>

                  {/* 사용자 이메일 */}
                  <td style={{ padding: "1rem", border: "1px solid #ddd" }}>
                    {user.email ? (
                      <a href={`mailto:${user.email}`} style={{ color: "#007bff" }}>
                        {user.email}
                      </a>
                    ) : (
                      <span style={{ color: "#999" }}>-</span>
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
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f0f0f0",
          borderRadius: "4px",
          fontSize: "0.9rem",
        }}
      >
        <p>
          <strong>📍 데이터 저장 위치:</strong>
        </p>
        <ul>
          <li>Firebase Realtime Database: <code>/vibe/users/&lt;uid&gt;</code></li>
          <li>조회 시마다 최신 데이터를 불러옵니다</li>
        </ul>
      </div>
    </div>
  );
}
