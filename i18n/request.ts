import {getRequestConfig} from 'next-intl/server';
import {cookies, headers} from 'next/headers';
import {DEFAULT_LOCALE, LOCALES} from '@/app/app.config';

// Next-Intl 요청 설정
// i18n routing 없이 쿠키 기반으로 locale을 결정합니다
export default getRequestConfig(async () => {
  // 쿠키에서 locale 읽기 (Next.js 16+: await 필요)
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value;

  // 쿠키가 없으면 Accept-Language 헤더에서 읽기
  if (!locale) {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');

    if (acceptLanguage) {
      // Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
      // 첫 번째 언어 코드 추출
      const preferredLocale = acceptLanguage.split(',')[0].split('-')[0];

      // 지원하는 언어인지 확인
      if (LOCALES.includes(preferredLocale as any)) {
        locale = preferredLocale;
      }
    }
  }

  // 여전히 locale이 없으면 기본값 사용
  const safeLocale = locale || DEFAULT_LOCALE;

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default
  };
});
