'use server';

import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';

// 서버 액션: 사용자가 선택한 언어를 쿠키에 저장
// 이 함수는 클라이언트 컴포넌트에서 호출되어 언어를 변경합니다
//
// @param locale - 변경할 언어 코드 ('en', 'ko', 'zh', 'ja')
// @param redirectTo - 리다이렉트할 경로 (현재 페이지 경로)
export async function setLocale(locale: string, redirectTo: string) {
  // NEXT_LOCALE 쿠키에 선택한 언어 저장
  // Next.js 16+: cookies()는 Promise를 반환하므로 await 필요
  // 이 쿠키는 proxy.ts에서 최우선으로 확인됩니다
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',                      // 모든 경로에서 접근 가능
    maxAge: 60 * 60 * 24 * 365,     // 1년간 유지
    sameSite: 'lax',                // CSRF 보호
    secure: process.env.NODE_ENV === 'production'  // 프로덕션에서는 HTTPS만
  });

  // 페이지 새로고침으로 변경된 언어 적용
  // redirect()를 사용하면 서버에서 새로운 언어로 페이지를 다시 렌더링합니다
  redirect(redirectTo);
}
