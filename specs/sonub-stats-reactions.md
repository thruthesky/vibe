---
title: Sonub Reactions & Stats Overview
status: draft
version: 1.0.0
created: 2025-11-18
updated: 2025-11-18
author: Codex (GPT-5)
tags:
  - reactions
  - stats
  - sidebar
  - dashboard
---

## 개요

홈 화면 좌측 사이드바의 `Reactions`(항목 4)과 `Stats`(항목 5), 그리고 신규 페이지 `/my/reactions`, `/my/stats`의 역할과 데이터 흐름을 정의한다.  
두 페이지는 모두 로그인 사용자의 퍼스널 대시보드 영역이며, 서비스 초기에 공사중(placeholder) 상태로 제공한 뒤 점진적으로 기능을 채워 넣는다.

---

## 페이지 사양

### `/my/reactions`
- **URL**: `/my/reactions`
- **목적**: 내 게시글/댓글(`/chat-messages/{messageId}`)에 달린 좋아요(`/likes/{uid}/{targetId}`)와 댓글 기록을 한 곳에서 확인
- **데이터 소스**
  - `likes/{uid}/{messageId}`: 내가 좋아요를 누른 대상
  - `chat-message-likes/{messageId}`: 내 글/댓글에 좋아요를 남긴 사용자 목록 (향후 표시 예정)
  - `chat-comments/{messageId}`: 내 글/댓글에 달린 코멘트
- **현재 상태**: `Card` 컴포넌트로 공사중 메시지를 노출 (Svelte 파일: `src/routes/my/reactions/+page.svelte`)
- **향후 구현 노트**
  1. 좋아요/댓글 이력을 시간순으로 정렬
  2. 각 항목 클릭 시 원본 게시글(`/chat-messages/{messageId}`)로 이동
  3. `createRealtimeStore`를 사용하여 실시간 반영

### `/my/stats`
- **URL**: `/my/stats`
- **목적**: 일/월/년 단위의 팔로워/팔로잉/좋아요/댓글 수치를 확인
- **데이터 소스 제안**
  - `/stats/{uid}/{yyyymmdd}` 노드 구조 예시
    ```json
    {
      "followers": 120,
      "following": 85,
      "likeCount": 340,
      "commentCount": 57
    }
    ```
  - Cloud Functions가 매일 집계하여 `yyyymmdd`별로 저장
  - `/stats/{uid}/overview`에 최신 스냅샷을 보관하여 빠른 조회 지원
- **현재 상태**: 공사중 카드만 렌더링 (`src/routes/my/stats/+page.svelte`)
- **향후 구현 노트**
  1. 날짜 범위 선택(일/월/년) 컴포넌트 추가
  2. 팔로워/좋아요/댓글 증감률을 시각화 (차트 라이브러리 or Tailwind)
  3. `/stats/{uid}/{yyyymmdd}` 데이터가 없을 경우 안내 메시지 표시

---

## 홈 좌측 사이드바 연동

### 링크 구성
| 번호 | 라벨 | 링크 | 비고 |
| --- | --- | --- | --- |
| 4 | Reactions | `/my/reactions` | 나의 글/댓글 반응 기록 |
| 5 | Stats | `/my/stats` | `/stats/{uid}/{yyyymmdd}` 기반 통계 |

### 데이터 바인딩
- `src/lib/components/left-sidebar.svelte`
  - 로그인 시 `/user-followers/{uid}`, `/user-following/{uid}`를 `createRealtimeStore`로 구독하여 카운트를 표시
  - 섹션 6~8(최근 사용자/오픈챗/활동)은 각각 `users`, `chat-rooms`, `chat-messages` 노드를 조회
  - 언어 선택 드롭다운은 Paraglide `setLocale()` 사용

---

## 향후 작업 체크리스트
1. `/likes`·`/chat-message-likes` 데이터를 합산하여 `내 반응` 타임라인 작성
2. `/stats/{uid}/{yyyymmdd}` Cloud Functions 집계 로직 정의 및 배포
3. `/my/stats`에 기간 선택기, 비교(전일 대비) 배지, 다운로드 버튼 추가
4. 사이드바 Reactions/Stats 섹션에 핵심 지표(오늘 받은 좋아요 수 등) 요약 배치

---

## 작업 이력 (SED Log)
| 날짜 | 작성자 | 내용 |
| --- | --- | --- |
| 2025-11-18 | Codex | `/my/reactions`, `/my/stats` 공사중 페이지 생성 및 홈 사이드바 링크/설명 추가 |
