---
title: categories.ts - TypeScript 소스 코드
original_path: shared/categories.ts
category: source
file_type: ts
status: current
last_updated: 2025-11-20
---

# categories.ts

## 개요

**원본 경로**: `shared/categories.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 게시판 카테고리 상수 정의
 *
 * 이 파일은 클라이언트(SvelteKit)와 서버(Firebase Cloud Functions) 모두에서 공유됩니다.
 *
 * @description
 * - discussion: 자유토론
 * - qna: 질문
 * - news: 뉴스
 * - info: 정보
 * - selling: 판매
 * - hiring: 구인구직
 * - travel: 여행
 * - mukbang: 먹방
 * - realestate: 부동산
 * - hobby: 취미
 * - story: 나의 이야기
 */

import { toInvertedCategoryOrder } from './order-value.utils';

/**
 * 게시판 카테고리 목록 (읽기 전용 배열)
 */
export const FORUM_CATEGORIES = [
  "discussion",
  "qna",
  "news",
  "info",
  "selling",
  "hiring",
  "travel",
  "mukbang",
  "realestate",
  "hobby",
  "story",
] as const;

/**
 * 게시판 카테고리 타입
 *
 * FORUM_CATEGORIES 배열의 요소 중 하나만 허용됩니다.
 */
export type ForumCategory = (typeof FORUM_CATEGORIES)[number];

/**
 * 카테고리 ID가 유효한지 검증하는 함수
 *
 * @param category - 검증할 카테고리 ID
 * @returns 유효한 카테고리면 true, 아니면 false
 *
 * @example
 * ```typescript
 * isValidCategory("qna"); // true
 * isValidCategory("invalid"); // false
 * ```
 */
export function isValidCategory(category: string): category is ForumCategory {
  return FORUM_CATEGORIES.includes(category as ForumCategory);
}

/**
 * 카테고리와 타임스탬프로 categoryOrder 필드 생성 (역순 문자열)
 *
 * Firebase는 문자열을 사전순으로 오름차순 정렬합니다.
 * 최신 게시글을 위에 표시하려면 타임스탬프를 역순으로 저장합니다.
 *
 * @param category - 카테고리 ID
 * @param timestamp - Unix timestamp (밀리초)
 * @returns categoryOrder 문자열 (예: "qna-8289999999999")
 *
 * @example
 * ```typescript
 * createCategoryOrder("qna", 1710000000000);
 * // 반환값: "qna-8289999999999"
 * ```
 */
export function createCategoryOrder(
  category: ForumCategory,
  timestamp: number
): string {
  return toInvertedCategoryOrder(category, timestamp);
}

/**
 * categoryOrder 필드를 파싱하여 카테고리와 타임스탬프 추출
 *
 * @param categoryOrder - 파싱할 categoryOrder 문자열
 * @returns 카테고리와 타임스탬프 객체, 파싱 실패 시 null
 *
 * @example
 * ```typescript
 * parseCategoryOrder("qna-1698473000000");
 * // 반환값: { category: "qna", timestamp: 1698473000000 }
 * ```
 */
export function parseCategoryOrder(categoryOrder: string): {
  category: ForumCategory;
  timestamp: number;
} | null {
  const parts = categoryOrder.split("-");
  if (parts.length !== 2) {
    return null;
  }

  const [category, timestampStr] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (!isValidCategory(category) || isNaN(timestamp)) {
    return null;
  }

  return { category, timestamp };
}
```
