// 기본 레이아웃 컴포넌트
// 모든 페이지가 이 레이아웃을 공유합니다
import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { Topbar } from "@/components/topbar";
import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { TestFab } from "@/components/test-fab";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "./app.config";
import "./globals.css";

export const metadata: Metadata = {
  title: "바이브",
  description: "바이브 웹/앱 개발 스터디 프로젝트",
};

// Next-Intl을 i18n routing 없이 사용
// i18n/request.ts에서 쿠키 기반으로 locale을 결정합니다
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 쿠키에서 locale 읽기 (i18n/request.ts와 동일한 로직)
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value as Locale;

  // 쿠키가 없으면 Accept-Language 헤더에서 읽기
  if (!locale) {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');

    if (acceptLanguage) {
      const preferredLocale = acceptLanguage.split(',')[0].split('-')[0];
      if (LOCALES.includes(preferredLocale as any)) {
        locale = preferredLocale as Locale;
      }
    }
  }

  // 여전히 locale이 없으면 기본값 사용
  const safeLocale = locale || DEFAULT_LOCALE;

  // i18n/request.ts에서 제공하는 messages 가져오기
  const messages = await getMessages();

  return (
    <html lang={safeLocale}>
      <body>
        {/* Next-Intl Provider: 모든 하위 컴포넌트에서 번역 사용 가능 */}
        <NextIntlClientProvider locale={safeLocale} messages={messages}>
          {/* 모든 페이지 상단에 고정된 탑바 */}
          <Topbar />

          {/* 탑바 높이만큼 여백을 주어 컨텐츠가 탑바에 가려지지 않도록 함 */}
          <div className="pt-16">
            {/* 3단 레이아웃 컨테이너: 최대 너비 1200px, 중앙 정렬 */}
            <div className="mx-auto max-w-[1200px] flex">
              {/* 왼쪽 사이드바 - 데스크톱에서만 표시 */}
              <div className="hidden lg:block">
                <LeftSidebar />
              </div>

              {/* 메인 콘텐츠 - 항상 표시 (모바일/데스크톱) */}
              <main className="flex-1 min-w-0">
                {children}
              </main>

              {/* 오른쪽 사이드바 - 데스크톱에서만 표시 */}
              <div className="hidden lg:block">
                <RightSidebar />
              </div>
            </div>
          </div>

          {/* 테스트용 Floating Action Button (개발/테스트 환경에서만 표시) */}
          <TestFab />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
