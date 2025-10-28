"use client";

// 오른쪽 사이드바 컴포넌트
// 통계 정보를 표시합니다.

import { useState, useEffect } from "react";
import { User, FileText, MessageCircle, TrendingUp } from "lucide-react";

export function RightSidebar() {
  // 통계 데이터 (향후 실제 Firebase 데이터로 교체)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalMessages: 0,
    onlineUsers: 0,
  });

  // 통계 데이터 로드 (향후 Firebase에서 가져오기)
  useEffect(() => {
    // 임시 통계 데이터
    // TODO: Firebase에서 실제 데이터 가져오기
    setStats({
      totalUsers: 8, // 테스트 계정 A~H
      totalPosts: 0, // 게시판 구현 후 업데이트
      totalMessages: 0, // 채팅 메시지 수
      onlineUsers: 1, // 현재 접속자 수
    });
  }, []);

  return (
    <aside className="w-64 border-l bg-background p-4">
      <div className="sticky top-20 space-y-6">
        {/* 통계 헤더 */}
        <div>
          <h2 className="text-lg font-bold mb-4">통계</h2>
        </div>

        {/* 통계 카드 */}
        <div className="space-y-4">
          {/* 전체 사용자 수 */}
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">전체 사용자</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>

          {/* 현재 접속자 수 */}
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">현재 접속</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.onlineUsers}</p>
          </div>

          {/* 전체 글 수 */}
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">전체 글</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.totalPosts}</p>
            <p className="text-xs text-muted-foreground mt-1">준비 중</p>
          </div>

          {/* 전체 메시지 수 */}
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">채팅 메시지</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.totalMessages}</p>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t"></div>

        {/* 추가 정보 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>통계는 실시간으로 업데이트됩니다.</p>
        </div>
      </div>
    </aside>
  );
}
