import {defineRouting} from 'next-intl/routing';
import {LOCALES, DEFAULT_LOCALE} from '@/app/app.config';

// Next-Intl 라우팅 설정
// Cookie-based 언어 감지 전략을 사용합니다
export const routing = defineRouting({
  // 지원하는 모든 언어 목록
  // app.config.ts에서 정의된 언어 목록 사용
  locales: LOCALES,

  // 기본 언어 (언어 감지 실패 시 fallback)
  // 브라우저 언어 감지 실패 시 영어로 표시
  defaultLocale: DEFAULT_LOCALE,

  // URL에 언어 접두사를 절대 붙이지 않음
  // ✅ /about (올바름)
  // ❌ /en/about (사용 안 함)
  // ❌ /ko/about (사용 안 함)
  //
  // 언어 정보는 NEXT_LOCALE 쿠키에 저장됩니다
  localePrefix: 'never'
});
