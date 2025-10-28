// 홈페이지 컴포넌트
"use client";

import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase 인증 상태 확인
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* 바이브 코딩 배너 */}
        <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-800 text-center">
          <p className="text-sm font-medium">
            🤖 현재 보시고 계시는 이 사이트는 100% 바이브 코딩으로만 만들어졌습니다.
          </p>
        </div>

        {/* 페이지 제목 및 소개 */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">바이브 코딩 스터디 프로젝트</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            누구든지 참여를 할 수 있습니다. PR 하시거나,{" "}
            <a
              href="https://open.kakao.com/o/gn2qMetf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              한바보
            </a>{" "}
            단톡방에 참여해주세요.
          </p>
        </div>

        {/* TODO 목록 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            📋 해야할 일 (TODO)
          </h2>
          <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
            <li><strong>디자인:</strong> 탑바에 로그인 사용자 업로드.</li>
            <li><strong>대화방 참여 목록:</strong> vibe/chat/joins 에 저장해서, 채팅방 목록을 표시하고, 클릭하여 입장.</li>
            <li><strong>게시판</strong></li>
            <li><strong>푸시 알림</strong></li>
            <li><strong>Flutter iOS/Android 앱 개발</strong></li>
          </ol>
        </div>


        {!loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4" style={{ marginTop: "2rem" }}>
          {userId ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">로그인 성공!</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>사용자 ID:</strong> <code className="bg-slate-100 px-2 py-1 rounded text-xs">{userId}</code>
                </p>
              </div>
              {/* 로그인한 사용자를 위한 메뉴 */}
              <div className="flex gap-2 flex-wrap">
                {/* 회원 정보 수정 링크 */}
                <a
                  href="/profile"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  회원 정보 수정
                </a>
                {/* 로그아웃 버튼 */}
                <button
                  onClick={async () => {
                    await auth.signOut();
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">시작하기</h2>
              {/* 로그인 및 회원가입 링크 */}
              <div className="flex gap-2 flex-wrap">
                <a
                  href="/auth/login"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-sm font-medium transition-colors"
                >
                  로그인
                </a>
                {/* 회원가입 페이지로 이동하는 링크 */}
                <a
                  href="/auth/signup"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-sm font-medium transition-colors"
                >
                  회원가입
                </a>
              </div>
            </div>
          )}
        </div>
      )}

        {/* 모든 사용자가 접근 가능한 메뉴 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">메뉴</h2>
          <div className="flex gap-2 flex-wrap">
            {/* 회원 목록 페이지 링크 */}
            <a
              href="/users"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors"
            >
              회원 목록
            </a>
            {/* 프로젝트 GitHub 링크 */}
            <a
              href="https://github.com/thruthesky/vibe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              프로젝트 깃헙
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
