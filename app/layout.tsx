// 기본 레이아웃 컴포넌트
// 모든 페이지가 이 레이아웃을 공유합니다
import type { Metadata } from "next";
import { Topbar } from "@/components/topbar";
import { TestFab } from "@/components/test-fab";
import "./globals.css";

export const metadata: Metadata = {
  title: "바이브",
  description: "바이브 웹/앱 개발 스터디 프로젝트",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 모든 페이지 상단에 고정된 탑바 */}
        <Topbar />
        {/* 탑바 높이만큼 여백을 주어 컨텐츠가 탑바에 가려지지 않도록 함 */}
        <main className="pt-16">{children}</main>
        {/* 테스트용 Floating Action Button (개발/테스트 환경에서만 표시) */}
        <TestFab />
      </body>
    </html>
  );
}
