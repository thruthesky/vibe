// 기본 레이아웃 컴포넌트
// 모든 페이지가 이 레이아웃을 공유합니다
import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
