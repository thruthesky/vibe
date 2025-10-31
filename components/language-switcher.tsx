'use client';

import {useTransition} from 'react';
import {useLocale} from 'next-intl';
import {setLocale} from '@/app/actions/set-locale';
import {LOCALES, LOCALE_INFO, type Locale} from '@/app/app.config';

// 언어 선택 드롭다운 컴포넌트
// 사용자가 언어를 선택하면 쿠키에 저장하고 페이지를 새로고침합니다
export function LanguageSwitcher() {
  // 현재 선택된 언어 가져오기
  const currentLocale = useLocale() as Locale;

  // 언어 변경 시 로딩 상태 관리
  // startTransition으로 감싸면 UI가 응답성을 유지합니다
  const [isPending, startTransition] = useTransition();

  // 언어 선택 변경 핸들러
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value as Locale;

    // 현재 페이지 경로 저장 (쿼리 파라미터, 해시 포함)
    const currentPath = window.location.pathname +
                       window.location.search +
                       window.location.hash;

    // 서버 액션 호출: 쿠키에 언어 저장 후 페이지 새로고침
    startTransition(() => {
      setLocale(nextLocale, currentPath);
    });
  };

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      disabled={isPending}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="언어 선택"
    >
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_INFO[locale].flag} {LOCALE_INFO[locale].name}
        </option>
      ))}
    </select>
  );
}
