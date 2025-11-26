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

Vibers는 **"바이브 코딩(Vibe Coding)"** 플랫폼입니다. 자연어 프롬프트로 웹 애플리케이션을 생성하는 AI 기반 서비스로, 사용자가 원하는 앱을 설명하면 AI(Gemini)가 완전한 HTML 앱을 생성하고, 고유한 서브도메인(xxx.vibers.kr)으로 즉시 접근할 수 있습니다.

### 핵심 개념

- **바이브 코딩**: 코드를 직접 작성하지 않고, 자연어로 원하는 기능을 설명하면 AI가 완전한 웹 앱을 생성
- **즉시 배포**: 생성된 앱은 자동으로 고유한 서브도메인에 배포되어 즉시 공유 가능
- **단일 파일 앱**: HTML, CSS, JavaScript가 모두 포함된 self-contained 앱 생성

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

## 상세 코드 로직

### 1. AI 모델 설정 (`src/lib/firebase.ts`)

Firebase AI Logic을 사용하여 Gemini 2.5 Flash Lite 모델을 초기화합니다.

```typescript
// Firebase AI Logic 초기화 (Gemini Developer API 백엔드 사용)
const ai = getAI(app, { backend: new GoogleAIBackend() });

// 시스템 프롬프트 - AI가 순수 HTML만 반환하도록 지시
const systemInstruction = `당신은 자바스크립트 전문 개발자입니다...`;

// Gemini 모델 생성
export const model = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-lite",
  systemInstruction: systemInstruction
});
```

**중요**: AI는 순수 HTML만 반환해야 합니다. JSON 형식이나 마크다운 코드 블록으로 감싸면 안 됩니다.

### 2. 채팅 및 앱 생성 (`src/routes/+page.svelte`)

사용자 프롬프트를 받아 AI 응답을 스트리밍으로 처리합니다.

```typescript
async function handlePromptSubmit(prompt: string) {
  // 1. 멀티턴 채팅을 위한 히스토리 준비
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // 2. 채팅 세션 시작 및 스트리밍 응답
  const chat = model.startChat({ history, generationConfig: { maxOutputTokens: 8192 } });
  const result = await chat.sendMessageStream(prompt);

  // 3. 스트림에서 청크 단위로 텍스트 수집 (실시간 UI 업데이트)
  for await (const chunk of result.stream) {
    fullText += chunk.text();
    // UI 업데이트
  }

  // 4. HTML 추출 (DOCTYPE부터 </html>까지)
  const htmlMatch = cleanedText.match(/<!DOCTYPE\s+html[^>]*>[\s\S]*<\/html>/i);
  htmlContent = htmlMatch[0];

  // 5. 서버에 HTML 저장
  const saveResponse = await fetch('/api/save-html', {
    method: 'POST',
    body: JSON.stringify({ html: htmlContent })
  });
}
```

### 3. HTML 저장 API (`src/routes/api/save-html/+server.ts`)

생성된 HTML을 파일로 저장하고 고유한 서브도메인을 반환합니다.

```typescript
export const POST: RequestHandler = async ({ request }) => {
  const { html } = await request.json();

  // 8자리 랜덤 서브도메인 ID 생성 (예: abc12xyz)
  const subdomain = generateSubdomainId();

  // HTML 파일 저장
  const filePath = path.join(OUT_DIR, `${subdomain}.html`);
  await writeFile(filePath, html, 'utf-8');

  return json({
    success: true,
    subdomain,
    url: `https://vibers.kr/app/${subdomain}`
  });
};
```

**저장 경로**:
- 개발: `./static/generated/`
- 프로덕션: `/var/app/generated/`

### 4. 앱 렌더링 (`src/routes/app/[subdomain]/+page.server.ts`)

저장된 HTML 파일을 읽어서 렌더링합니다.

```typescript
export const load: PageServerLoad = async ({ params }) => {
  const filePath = path.join(OUT_DIR, `${params.subdomain}.html`);
  const htmlContent = await readFile(filePath, 'utf-8');

  return { subdomain: params.subdomain, htmlContent };
};
```

### 5. 서브도메인 처리 (`src/hooks.server.ts`)

`*.vibers.kr` 요청을 감지하여 서브도메인을 추출합니다.

```typescript
export const handle: Handle = async ({ event, resolve }) => {
  const host = event.request.headers.get('host') ?? '';

  // abc123.vibers.kr → subdomain = "abc123"
  const sub = host.endsWith('.vibers.kr') ? host.slice(0, -'.vibers.kr'.length) : null;
  event.locals.subdomain = sub;

  return resolve(event);
};
```

### 6. 서브도메인 유틸리티 (`src/lib/utils/subdomain.ts`)

```typescript
// 8자리 랜덤 ID 생성 (a-z, 0-9)
export function generateSubdomainId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 서브도메인 유효성 검사 (3-20자, 영문소문자+숫자)
export function isValidSubdomain(subdomain: string): boolean {
  return /^[a-z0-9]{3,20}$/.test(subdomain);
}
```

### 7. UI 컴포넌트 (`src/lib/components/ChatSidebar.svelte`)

채팅 사이드바 컴포넌트로, 사용자 입력을 받고 메시지를 표시합니다.

```svelte
<script lang="ts">
  // Svelte 5 runes 사용
  let { messages = $bindable<Message[]>([]), onSubmit, isGenerating = false } = $props();
  let prompt = $state('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onSubmit(prompt);
    prompt = '';
  }
</script>
```

## 데이터 흐름 다이어그램

```
사용자 프롬프트 입력
        ↓
ChatSidebar.svelte (onSubmit 콜백)
        ↓
+page.svelte (handlePromptSubmit)
        ↓
Firebase AI (Gemini) - 스트리밍 응답
        ↓
HTML 추출 (정규식으로 DOCTYPE~</html> 추출)
        ↓
/api/save-html (POST) - 파일 저장
        ↓
서브도메인 ID 반환 (예: abc12xyz)
        ↓
iframe으로 미리보기 표시 (/app/abc12xyz)
        ↓
사용자에게 링크 제공 (abc12xyz.vibers.kr)
```

## 접근 경로

생성된 앱은 두 가지 방법으로 접근할 수 있습니다:

1. **경로 기반**: `https://vibers.kr/app/{subdomain}`
2. **서브도메인 기반**: `https://{subdomain}.vibers.kr`

두 경로 모두 동일한 HTML 파일을 렌더링합니다.

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
