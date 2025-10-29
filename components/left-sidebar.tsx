// 왼쪽 사이드바 컴포넌트
// 퀵메뉴 링크와 인증 상태에 따른 빠른 접근 링크를 제공합니다.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Home, MessageCircle, Users, User, FileText, ExternalLink, BookOpen, LogIn, LogOut } from "lucide-react";

export function LeftSidebar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase 인증 상태 확인
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <aside className="w-64 border-r bg-background p-4">
      <div className="sticky top-20">
        <h2 className="text-lg font-bold mb-4">퀵 메뉴</h2>
        <nav className="space-y-2">
          {/* 홈 */}
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>홈</span>
          </Link>

          {/* 채팅 */}
          <Link
            href="/chat/room"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span>채팅</span>
          </Link>

          {/* 사용자 목록 */}
          <Link
            href="/users"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>사용자 목록</span>
          </Link>

          {/* 프로필 */}
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <User className="h-5 w-5" />
            <span>내 프로필</span>
          </Link>

          {/* 게시판 (향후 추가 예정) */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground cursor-not-allowed">
            <FileText className="h-5 w-5" />
            <span>게시판 (준비 중)</span>
          </div>
        </nav>

        {/* 구분선 */}
        <div className="my-6 border-t"></div>

        {/* 시작하기 섹션 */}
        {!loading && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">시작하기</h3>
            <div className="space-y-2 mb-6">
              {user ? (
                <>
                  {/* 로그인한 사용자 - 프로필 수정 링크 */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>회원 정보 수정</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* 로그인하지 않은 사용자 - 로그인/회원가입 링크 */}
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>로그인</span>
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>회원가입</span>
                  </Link>
                </>
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t mb-6"></div>
          </div>
        )}

        {/* 링크 섹션 */}
        <div className="space-y-2">
          {/* 회원 목록 */}
          <Link
            href="/users"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            <Users className="h-4 w-4" />
            <span>회원 목록</span>
          </Link>

          {/* 프로젝트 GitHub */}
          <a
            href="https://github.com/thruthesky/vibe"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>프로젝트 깃헙</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </a>

          {/* 한바보 참여 단톡방 */}
          <a
            href="https://open.kakao.com/o/gn2qMetf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            <span>한바보 참여 단톡방</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </a>

          {/* 개발일지 */}
          <Link
            href="/dev/history"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span>개발일지</span>
          </Link>
        </div>
      </div>

      {/* 빌드 타임스탬프 - 현재 배포 시간으로 업데이트됨 */}
      <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>빌드 버전</span>
          <span className="font-mono">
            {/* 현재 시간의 Unix timestamp(밀리초)를 사용하여 빌드 날짜를 표시합니다 */}
            {new Date(1761753945000).toLocaleString(navigator.language, {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      </div>

      {/* Copyleft 정보 */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p className="leading-relaxed">
          © Copyleft
          <br />
          AI 가 만든 코드여서
          <br />
          저작권이 없습니다.
        </p>
      </div>
    </aside>
  );
}
