# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Standard Workflow

**중요: 이 워크플로우를 반드시 따라야 합니다.**

1. **배포**: 모든 작업이 완료되면 반드시 배포를 진행합니다.
   - 배포 명령어: `npm run deploy`
   - 배포 스크립트가 자동으로 빌드, 테스트, git push, Dokploy 배포를 수행합니다.
   - 배포 모니터링을 진행하고 결과(성공/실패, HTTP 상태 코드 등)를 개발자에게 알려주어야 합니다.

2. **배포 후 테스트**: 배포가 완료되면, 반드시 chrome-devtools로 웹 브라우저에 접속하여 "계산기를 만들어줘"라고 프롬프트를 입력한 다음, 계산기가 오른쪽 캔버스에 잘 표시되는지 확인해야 합니다.

## 프로젝트 개요

Vibers는 자연어 프롬프트로 웹 애플리케이션을 생성하는 AI 기반 플랫폼입니다. 사용자가 원하는 앱을 설명하면 AI가 완전한 HTML 앱을 생성하고, 고유한 서브도메인(xxx.vibers.kr)으로 접근할 수 있습니다.

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 타입 검사
npm run check

# 린트 및 포맷 검사
npm run lint

# 코드 포맷팅
npm run format

# E2E 테스트 실행
npm run test

# E2E 테스트 (UI 모드)
npm run test:ui

# 배포
npm run deploy
```

## 아키텍처

### 기술 스택
- **프론트엔드**: Svelte 5 + SvelteKit + TailwindCSS 4
- **백엔드**: SvelteKit API routes (adapter-node)
- **인증**: Firebase Auth (Google)
- **AI**: Firebase AI Logic (Gemini 2.5 Flash Lite)
- **배포**: Docker + Dokploy + Traefik

### 핵심 흐름
1. 사용자가 ChatSidebar에서 프롬프트 입력
2. `+page.svelte`에서 Firebase AI를 통해 HTML 생성 (스트리밍)
3. `/api/save-html` 엔드포인트로 HTML 저장
4. 생성된 앱은 `/app/[subdomain]` 경로나 `xxx.vibers.kr` 서브도메인으로 접근

### 주요 파일
- `src/hooks.server.ts` - 서브도메인 감지 (*.vibers.kr 처리)
- `src/lib/firebase.ts` - Firebase 초기화 및 Gemini 모델 설정
- `src/routes/+page.svelte` - 메인 채팅 UI 및 AI 응답 스트리밍
- `src/routes/api/save-html/+server.ts` - 생성된 HTML 파일 저장
- `src/routes/app/[subdomain]/` - 생성된 앱 렌더링

### Svelte 5 규칙
- `$state`, `$props`, `$bindable` runes 사용
- `let { data }: { data: PageData } = $props()` 형식으로 props 선언

## 테스트

E2E 테스트는 Playwright 사용:
- 테스트 파일: `tests/e2e/`
- 테스트 포트: 5174

단일 테스트 실행:
```bash
npx playwright test tests/e2e/homepage.spec.ts
```

## 환경 변수

- `PORT` - 서버 포트 (기본: 3000)
- `OUT_DIR` - 생성된 HTML 저장 디렉토리 (개발: `./static/generated`, 프로덕션: `/var/app/generated`)
