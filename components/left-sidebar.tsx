// 왼쪽 사이드바 컴포넌트
// 퀵메뉴 링크를 제공합니다.

import Link from "next/link";
import { Home, MessageCircle, Users, User, FileText, ExternalLink } from "lucide-react";

export function LeftSidebar() {
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

        {/* 퀵 링크 섹션 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground px-3">
            퀵 링크
          </h3>

          {/* 한바보 카카오톡 단톡방 */}
          <a
            href="https://open.kakao.com/o/g1w1KbNg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            <span>한바보 카톡방</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </a>
        </div>

        {/* 구분선 */}
        <div className="my-6 border-t"></div>

        {/* 추가 정보 */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">바이브</p>
          <p className="text-xs">
            소셜 웹 애플리케이션
          </p>
        </div>
      </div>
    </aside>
  );
}
