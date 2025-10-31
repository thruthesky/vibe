// Firebase Realtime Database의 루트 폴더
// 모든 데이터는 /{ROOT_FOLDER}/ 아래에 저장됩니다
export const ROOT_FOLDER = "vibe";

// 1:1 채팅방 ID 생성 시 두 UID를 연결하는 구분자
// 예: user123---user456
export const ROOM_SEPARATOR = "---";

// 게시판 카테고리 목록
// value: 데이터베이스에 저장되는 값
// label: 사용자에게 표시되는 레이블
export const FORUM_CATEGORIES = [
  { value: "community", label: "커뮤니티" },
  { value: "qna", label: "질문과답변" },
  { value: "news", label: "뉴스" },
  { value: "market", label: "회원장터" },
] as const;

// 지원 언어 목록
// 애플리케이션에서 지원하는 모든 언어 코드
export const LOCALES = ['en', 'ko', 'zh', 'ja'] as const;

// 기본 언어
// 사용자 언어 감지 실패 시 사용되는 fallback 언어
export const DEFAULT_LOCALE = 'en';

// 언어별 정보 (국기 이모지, 언어명)
// 언어 선택 UI에서 표시됩니다
export const LOCALE_INFO = {
  en: { flag: '🇺🇸', name: 'English' },
  ko: { flag: '🇰🇷', name: '한국어' },
  zh: { flag: '🇨🇳', name: '中文' },
  ja: { flag: '🇯🇵', name: '日本語' }
} as const;

// 타입 정의
export type Locale = typeof LOCALES[number];
