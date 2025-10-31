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
