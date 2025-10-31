import {NextRequest, NextResponse} from 'next/server';
import {LOCALES, DEFAULT_LOCALE} from './app/app.config';

// Next-Intl Middleware (Cookie-based, no routing)
// i18n routing 없이 쿠키 기반으로만 언어를 감지합니다
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 쿠키에서 현재 언어 확인
  let locale = request.cookies.get('NEXT_LOCALE')?.value;

  // 쿠키가 없으면 Accept-Language 헤더에서 감지
  if (!locale) {
    const acceptLanguage = request.headers.get('accept-language');

    if (acceptLanguage) {
      // Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
      const preferredLocale = acceptLanguage.split(',')[0].split('-')[0];

      // 지원하는 언어인지 확인
      if (LOCALES.includes(preferredLocale as any)) {
        locale = preferredLocale;
      }
    }
  }

  // 여전히 locale이 없으면 기본값 사용
  const finalLocale = locale || DEFAULT_LOCALE;

  // 쿠키가 없거나 다르면 설정
  if (!locale || locale !== finalLocale) {
    response.cookies.set('NEXT_LOCALE', finalLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1년
      sameSite: 'lax'
    });
  }

  return response;
}

// Middleware 적용 경로 설정
export const config = {
  // 정적 파일과 API 경로 제외
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
