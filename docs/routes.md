# Routes Guide - 라우트 가이드

현재 Vibe 프로젝트의 모든 페이지 라우트 목록입니다.

## 홈 및 기본 라우트

### / (홈페이지)
- 파일: app/page.tsx
- 설명: 프로젝트 소개, TODO 목록, 로그인/회원가입 버튼
- 접근권한: 모두 접근 가능

## 인증 라우트

### /auth/login (로그인)
- 파일: app/auth/login/page.tsx
- 설명: 이메일/비밀번호 로그인 페이지
- 접근권한: 모두 접근 가능

### /auth/signup (회원가입)
- 파일: app/auth/signup/page.tsx
- 설명: 새로운 사용자 회원가입 페이지
- 접근권한: 모두 접근 가능

## 사용자 관련 라우트

### /users (회원 목록)
- 파일: app/users/page.tsx
- 설명: 전체 사용자 목록 표시
- 접근권한: 모두 접근 가능

### /profile (회원 정보 수정)
- 파일: app/profile/page.tsx
- 설명: 로그인한 사용자의 프로필 수정
- 접근권한: 로그인한 사용자만

## 채팅 라우트

### /chat/room (1:1 채팅방)
- 파일: app/chat/room/page.tsx
- 설명: 두 사용자 간의 실시간 1:1 채팅
- 접근권한: 로그인한 사용자만
- 쿼리파라미터: otherId=<사용자UID>

## 메뉴 라우트

### /menu (메뉴 페이지)
- 파일: app/menu/page.tsx
- 설명: 로그인 상태에 따른 통합 메뉴
- 접근권한: 모두 접근 가능

## 관리자 라우트

### /admin (관리자 페이지)
- 파일: app/admin/page.tsx
- 설명: 관리자 도구 대시보드
- 접근권한: 로그인한 관리자

### /admin/test-data (테스트 데이터 생성)
- 파일: app/admin/test-data/page.tsx
- 설명: 포럼 뉴스 게시글 테스트 데이터 100개 생성
- 접근권한: 로그인한 관리자

## 개발 관련 라우트

### /dev/history (개발일지)
- 파일: app/dev/history/page.tsx
- 설명: 프로젝트 개발 진행 상황 기록
- 접근권한: 모두 접근 가능

---

페이지 이동 관련 작업을 할 때 이 문서를 반드시 참고하세요.
