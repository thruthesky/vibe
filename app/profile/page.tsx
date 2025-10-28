// 회원 정보 수정 페이지
// 사용자의 displayName을 수정하고 Firebase Realtime Database에 저장합니다.
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { saveUserDisplayName, getUserDisplayName } from "@/lib/user";

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Firebase 인증 상태 확인 및 현재 displayName 조회
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);

        // 현재 displayName 조회
        // 1. Firebase Authentication 프로필에서 조회
        if (user.displayName) {
          setDisplayName(user.displayName);
        } else {
          // 2. RTDB에서 조회
          const rtdbDisplayName = await getUserDisplayName(user.uid);
          if (rtdbDisplayName) {
            setDisplayName(rtdbDisplayName);
          }
        }
      } else {
        // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
        router.push("/auth/login");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 회원 정보 수정 폼 제출 핸들러
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!displayName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      if (!userId) {
        throw new Error("사용자 ID를 찾을 수 없습니다.");
      }

      // RTDB에 displayName 저장
      // 경로: /vibe/users/<uid>/displayName
      const result = await saveUserDisplayName(userId, displayName.trim());

      if (result.success) {
        setSuccess("이름이 성공적으로 수정되었습니다!");

        // 3초 후 홈페이지로 이동
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(result.error || "이름 수정에 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "이름 수정 중 오류가 발생했습니다.");
    }

    setLoading(false);
  }

  // 인증 상태 확인 중
  if (authLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>회원 정보 수정</h1>
      <p>사용자 이름(displayName)을 수정합니다.</p>

      {/* 오류 메시지 표시 */}
      {error && (
        <div
          style={{
            color: "white",
            backgroundColor: "#dc3545",
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* 성공 메시지 표시 */}
      {success && (
        <div
          style={{
            color: "white",
            backgroundColor: "#28a745",
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {success}
        </div>
      )}

      {/* 회원 정보 수정 폼 */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="displayName">이름</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="사용자 이름을 입력하세요"
            disabled={loading}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              backgroundColor: loading ? "#f5f5f5" : "white",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.75rem",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
            }}
          >
            {loading ? "저장 중..." : "저장"}
          </button>

          {/* 취소 버튼 */}
          <button
            type="button"
            onClick={() => router.push("/")}
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.75rem",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
            }}
          >
            취소
          </button>
        </div>
      </form>

      <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
        저장된 이름은 Firebase Realtime Database의 <code>/vibe/users/&lt;uid&gt;/displayName</code> 경로에 저장됩니다.
      </p>
    </div>
  );
}
