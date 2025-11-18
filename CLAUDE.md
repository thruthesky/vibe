# Workflow

- [ ] 당신은 Svelte5 + SvelteKit + Tailwind CSS + Svelte-Shadcn + Firebase Cloud Functions 개발 전문가입니다.
- [ ] 당신은 SED (Software Engineering Discipline) 방법론을 엄격히 준수합니다.
- [ ] 모든 소스 코드의 주석과 모든 문서는 한국어로 작성해야 합니다. 반드시 utf-8 인코딩을 사용해야 합니다.
- [ ] 반드시 https://sedai.dev/instructions 및 ./specs/index.md 파일을 먼저 읽고 이해해야 합니다.
- [ ] 개발자 요청을 받으면 [Workflow for Claude SED Agent](#workflow-for-claude-sed-agent)을 따릅니다.
- [ ] 관련된 사양 문서를 모두 읽고 YAML 헤더를 구문 분석합니다.
- [ ] 모든 개발작업이 끝나면, 반드시 작업한 내용을 요약하여 ./specs/\*.md 파일에 SED 형식에 맞게 기록해야 합니다.
- [ ] 가능한 모든 경우에서 Explore subagents 기능을 사용하여 high throughness 로 작업을 수행합니다.
- [ ] 개발자가 요청을 하면, 모든 경우(개발 작업)에서 최대한의 subagents 를 사용하여 병렬(Parallel)로 작업을 작업을 수행합니다.
- [ ] Firebase Cloud Functions 코드 `./firebase/functions/src` 작업이 끝난 다음 항상 `npm run deploy` 명령을 수행하여 배포를 합니다.
- [ ] 작업이 끝난 다음 항상 `npm run check` 명령을 수행하여 소스 코드를 검사하고, 발견된 모든 문제를 수정합니다.
- [ ] 작업이 끝난 다음 항상 개발자에게 아래의 체크리스트를 보여주고 다음 작업을 물어보세요.
  - [ ] 현재 작업의 수행 이유, 과정, 로직, 결과에 대해서 SED 사양을 엄격히 준수하여 ./specs/\*.md 파일에 업데이트하기
  - [ ] Git push 하기
  - [ ] 다음 작업 추천하기 -> 현재 작업에 이어서 다음 작업을 제안하기
- [ ] 만약, 임시 파일을 생성해야한다면, 반드시 `./tmp` 폴더에 생성해야 합니다.
- [ ] 개발자가 요청을 하면, 모든 경우(개발 작업)에서 최대한의 SED specifications 를 엄격히 준수하여 작업을 수행합니다.
  - [ ] 항상, **반드시** 작업을 수행할 때 마다 먼저,
    - [ ] [SED DTOC](./specs/index.md) 를 참고하고, 이 문서에서 적당한
    - [ ] 세부 스펙 문서를 읽고, 그 개념을 이해하고,
    - [ ] 세버 스펙의 워크플로에 따라서 작업을 해야 합니다.
- [ ] 개발자가 요청을 하면, 본 문서의 각 항목들을 엄격히 준수하여 작업을 수행합니다.
  - [ ] **🔥 코드 재사용 필수 (최우선)**: 모든 개발 작업 전에 반드시 `src/lib` 폴더에서 기존 함수/컴포넌트를 먼저 검색합니다. [코드 재사용 정책](#코드-재사용-정책) 섹션을 필수로 준수합니다.
  - [ ] Svelte 의 Tailwind CSS 스타일링은 아래의 [CSS 스타일링](#css-스타일링) 섹션을 따릅니다.
  - [ ] Svelte 의 paraglide i18n 다국어 처리는 아래의 [다국어 (i18n) 처리](#다국어-i18n-처리) 섹션을 따릅니다.
  - [ ] 모든 UI/UX 작업(코딩)을 할 때에 svelte-shadcn 과 Tailwind CSS 를 씁니다.
- [ ] 🔥🔥🔥 **Firebase Realtime Database Security Rules 작업 시 필수 규칙** 🔥🔥🔥
  - [ ] **반드시 [specs/repository/firebase/database.rules.json.md](./specs/repository/firebase/database.rules.json.md) 문서를 참고하여 작업합니다**
  - [ ] Firebase Database Rules는 **여러 줄 문자열을 지원**합니다. IDE의 JSON 린터 에러는 무시하세요.
  - [ ] **모든 `.read/.write/.validate` 조건식은 반드시 여러 줄로 나누어 작성합니다 (필수)**
  - [ ] `&&` 또는 `||` 연산자가 등장하면 각 조건을 새 줄에 작성합니다
  - [ ] 각 조건 블록 앞에는 세부 의도를 설명하는 주석을 남깁니다
  - [ ] 괄호 `()`로 조건의 우선순위를 명확히 표현합니다
  - [ ] **단일 줄 논리식은 절대 허용되지 않습니다**
  - [ ] **주석 없는 규칙은 허용되지 않습니다**
  - [ ] 예시:
    ```json
    ".write": "
      (
        auth != null
      )
      &&
      (
        auth.uid == $uid
      )
    "
    ```

## CSS 스타일링

개발자가 `css` 와 같이 요청을 하면, 아래의 규칙을 따라 업데이트를 해 주세요.

Svelte 의 Tailwind CSS 스타일링은 아래의 규칙을 따릅니다:

1. Tailwind CSS 유틸리티 클래스를 통해서만 CSS Styling 디자인 작업을 합니다.
   1. 인라인 `class="..."`를 사용는 것과
   2. `<style> ... { @apply ...; } </style>` 방식만 사용합니다.
   3. `<style> ... </style>` 내에 직접 Pure (Native) CSS 속성을 작성하지 않습니다.
2. Layout 관련된 Tailwind CSS utility class 는 `< class='...'>` 와 같이 inline class 에 직접 적용합니다.
   1. 예를 들면, `flex`, `grid`, `margin`, `padding`, `width`, `height`, `position` 등 레이아웃 관련된 클래스들은 인라인으로 직접 작성합니다.
   2. 그 외 (색상, 폰트, 여백, 테두리 등) 스타일 관련된 Tailwind CSS utility class 는 `<style> ... { @apply ...; } </style>` 방식을 사용하여 스타일링을 적용합니다.
3. [Svelte 전용 문법](./specs/sonub-design-tailwindcss.md#32-svelte-전용-문법) 섹션에서 설명한 것처럼 깔끔한 구조를 유지해주세요.
4. 오직, Light mode 만 사용합니다. Dark mode 는 사용하지 않습니다.
5. 그리고 반드시 [Sonub Tailwind CSS - SED Spec](./specs/sonub-setup-tailwind.md) 문서를 참고하여 스타일링 작업을 합니다.

## 다국어 (i18n) 처리

개발자가 `다국어`, `i18n`, `l10n` 와 같이 요청을 하면 아래의 과정을 따라서 다국어를 적용합니다:

1. 소스 코드에서 하드코딩된 모든 문자열을 찾아냅니다.
2. 각 문자열에 대해 고유한 키를 생성합니다. (예: `환영_인사`, `네트워크_에러`) 키는 반드시 한글로 합니다.
3. `./messages/*.json` 에 각 언어별로 JSON 파일을 업데이트합니다.
   - 예: `messages/ko.json`, `messages/en.json`, `messages/ja.json`, `messages/zh.json`
4. 소스 코드에서 하드코딩된 문자열을 제거하고, 다국어 라이브러리를 사용하여 해당 키로 문자열을 불러오도록 수정합니다.
   - 예: `import * as m from '$lib/paraglide/messages.js';` 후 `m.환영_인사()` 와 같이 사용해서 i18n 번역 텍스트 데이터 불러와 다국어 번역 적용

## 코드 재사용 정책

### ⚠️ 최고 우선순위 정책 (CRITICAL)

**모든 개발 작업을 시작하기 전에 반드시 `src/lib` 폴더에서 기존 함수, 컴포넌트, 로직이 존재하는지 먼저 검사해야 합니다.** 이는 선택사항이 아니라 **필수 규칙**입니다.

### 기본 원칙 (예외 없음)

1. **항상 검색부터 시작** - 새로운 기능을 구현하기 전에 `src/lib`에서 유사한 코드를 먼저 찾습니다
2. **중복 금지** - 이미 존재하는 함수/컴포넌트를 다시 만들지 않습니다
3. **재사용 우선** - 기존 코드가 있으면 반드시 재사용합니다
4. **공유 우선** - 새로 만드는 코드는 재사용 가능하도록 `src/lib`에 배치합니다
5. **RTDB 비용 최적화** - 전체 노드가 아닌 필요한 필드만 읽습니다

### 필수 작업 순서 (모든 개발 작업 시작 전)

**🔥 다음 순서를 반드시 따라야 합니다:**

1. **요구사항 분석** - 구현해야 할 기능을 명확히 파악
2. **기존 코드 검색** - `src/lib` 폴더에서 유사한 기능 탐색
   ```bash
   # 함수/컴포넌트 검색 예시
   grep -r "getUserField" src/lib/
   find src/lib -name "*user*.ts"
   find src/lib/components -name "*.svelte"
   ```
3. **기존 코드 발견 시:**
   - ✅ **재사용** - 기존 함수/컴포넌트를 import하여 사용
   - ✅ **확장** - 필요시 기존 코드를 확장 (매개변수 추가 등)
   - ❌ **중복 생성 금지** - 절대 같은 기능을 다시 만들지 않음

4. **기존 코드 없을 시:**
   - ✅ **공유 코드 생성** - `src/lib`에 재사용 가능한 형태로 구현
   - ✅ **문서화** - JSDoc 주석으로 사용법 명시
   - ✅ **타입 정의** - TypeScript 타입 명시

### 주요 검색 위치

- **함수**: `src/lib/functions/`
  - `user.functions.ts` - 사용자 관련 함수
  - `chat.functions.ts` - 채팅 관련 함수
  - `post.functions.ts` - 게시글 관련 함수
  - `comment.functions.ts` - 댓글 관련 함수
  - `like.functions.ts` - 좋아요 관련 함수
  - `room.functions.ts` - 채팅방 관련 함수

- **컴포넌트**: `src/lib/components/`
  - 공통 UI 컴포넌트
  - 재사용 가능한 Svelte 컴포넌트

- **타입**: `src/lib/types/`
- **스토어**: `src/lib/stores/`
- **유틸**: `src/lib/utils/`

### RTDB 비용 최적화 예시

**❌ 나쁜 예: 전체 노드 읽기**
```typescript
// 컴포넌트 내부에서 직접 구현 (재사용 불가)
const userRef = ref(database, `users/${uid}`);  // ❌ 전체 노드 읽기
const snapshot = await get(userRef);
```

**✅ 좋은 예: 기존 함수 재사용**
```typescript
// src/lib/functions/user.functions.ts에서 재사용
import { getUserFields } from '$lib/functions/user.functions';

// ✅ 필요한 필드만 읽어서 RTDB 비용 절감
const userData = await getUserFields(uid, ['displayName', 'photoUrl']);
```

### 금지 사항 (절대 금지)

❌ **중복 코드 생성** - 이미 존재하는 함수/컴포넌트를 다시 만들지 않습니다
❌ **컴포넌트 내부 함수** - 재사용 불가능한 함수를 컴포넌트 내부에 구현하지 않습니다
❌ **RTDB 전체 노드 읽기** - 필요한 필드만 개별적으로 읽습니다
❌ **문서화 없는 함수** - JSDoc 주석 없이 공유 함수를 작성하지 않습니다

### 권장 사항

✅ **범용 함수 작성** - 유연하고 재사용 가능한 함수를 만듭니다
✅ **Promise.all() 사용** - 여러 필드를 병렬로 읽어서 성능을 최적화합니다
✅ **컴포넌트 재사용** - 항상 기존 컴포넌트를 먼저 찾아서 사용합니다
✅ **기존 함수 확장** - 기존 함수를 활용하여 새로운 기능을 추가합니다

### 상세 가이드라인

더 자세한 내용은 다음 문서를 참고하세요:
- [Sonub Design Guideline - 코드 재사용 정책](./specs/sonub-design-guideline.md#4-코드-재사용-정책-code-reusability-policy)

## 빌드 버전 업데이트

개발자가 **"버전 업데이트"** 또는 **"빌드 버전 업데이트"** 요청 시:

1. `src/lib/version.ts` 파일의 `BUILD_VERSION` 값을 현재 날짜와 시간으로 업데이트합니다.
2. 형식: `YY. MM. DD. h:mmAM/PM` (예: "25. 11. 09. 8:49PM")
3. 날짜 형식 규칙:
   - 년도(YY): 2자리 (예: 25 = 2025년)
   - 월(MM): 2자리, 앞에 0 패딩 (예: 01, 02, ... 11, 12)
   - 일(DD): 2자리, 앞에 0 패딩 (예: 01, 02, ... 31)
   - 시간: 12시간 형식 (1-12), 분은 2자리 (예: 8:49PM, 11:05AM)
   - AM/PM: 대문자
   - 구분자: 마침표(.) + 공백
4. 업데이트 후 개발자에게 새 버전을 알려줍니다.

**예시:**

```typescript
export const BUILD_VERSION = '25. 11. 09. 8:49PM';
```

# Workflow for Claude SED Agent

- [ ] Learn SED Methodology: Read the following pages and understand SED methodology:
  - https://sedai.dev
  - https://sedai.dev/principles
  - https://sedai.dev/philosophy

- [ ] Always Consult Specifications First: Before starting any development task, read https://sedai.dev/instructions and ./specs/index.md

- [ ] Strict Specification Obedience:
  - Follow specifications exactly, even if they appear incorrect
  - Never implement features not defined in specifications
  - Never modify specifications directly during implementation
  - If specifications are unclear, ask for clarification rather than guessing

- [ ] Error Reporting Protocol: When critical errors are detected in specifications:
  - Halt development immediately
  - Report the issue to developers with specific details
  - Recommend specification improvements
  - Wait for specification updates before continuing

- [ ] Ask for Clarification When Needed: When specifications are ambiguous or incomplete:
  - Request clarification from the developer instead of making assumptions
  - Ask for specific details about logic, source code, styles, or any other information needed
  - Never proceed with implementation based on guesswork or inference
  - Ensure all details are explicitly documented before continuing development

- [ ] SED Specification Documentation Rules: When creating or updating specification files in ./specs/*.md:
  - **❌ 절대 금지: 변경 이력 섹션을 작성하지 마세요**
  - 변경 이력 섹션 (예: "## 변경 이력", "## Change History", "## History") 을 스펙 문서에 포함하지 않습니다
  - 스펙 문서는 현재 상태만을 기록합니다. 과거의 변경 사항은 Git 커밋 히스토리로 관리됩니다
  - 만약 변경 이력 섹션이 있는 기존 스펙 문서를 수정하는 경우, 변경 이력 섹션을 제거하고 현재 상태만 유지합니다
