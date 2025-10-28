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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">회원 정보 수정</h1>
          <p className="text-muted-foreground mt-2">사용자 이름을 수정합니다</p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* 회원 정보 수정 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 입력 */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-2">
              이름
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="사용자 이름을 입력하세요"
              disabled={loading}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-foreground placeholder-muted-foreground disabled:bg-slate-100 disabled:text-muted-foreground"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            {/* 저장 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? "저장 중..." : "저장"}
            </button>

            {/* 취소 버튼 */}
            <button
              type="button"
              onClick={() => router.push("/")}
              disabled={loading}
              className="flex-1 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </form>

        {/* 정보 텍스트 */}
        <p className="mt-6 text-xs text-muted-foreground text-center">
          저장된 이름은 Firebase Realtime Database의 <code className="bg-slate-100 px-1 py-0.5 rounded">/vibe/users/&lt;uid&gt;/displayName</code> 경로에 저장됩니다.
        </p>
      </div>
    </div>
  );
}
