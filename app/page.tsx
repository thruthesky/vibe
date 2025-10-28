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

        {/* 프로젝트 개요 */}
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">AI와 함께하는 협업 개발 경험</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">한바보</strong>(한국 바이버 보스)는 AI 기반 바이브 코딩으로 실전 소셜 웹 애플리케이션을 만드는
            오픈소스 스터디 커뮤니티입니다. 코드는 AI에게 맡기고, 설계와 기획에 집중하며,
            Git을 통한 협업과 실제 배포까지 경험합니다. 인증, 게시판, 채팅, 알림 등 실용적인 기능을 구현하며,
            지속 가능한 개발 능력과 AI 컨트롤 역량을 기릅니다.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-full text-sm text-muted-foreground">
              💬 소스 코딩 금지
            </span>
            <span className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-full text-sm text-muted-foreground">
              🤝 실전 협업
            </span>
            <span className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-full text-sm text-muted-foreground">
              🎯 실용적 기능
            </span>
            <span className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-full text-sm text-muted-foreground">
              📚 함께 성장
            </span>
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
