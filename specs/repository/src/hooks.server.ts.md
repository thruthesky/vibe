---
title: hooks.server.ts - TypeScript 소스 코드
original_path: src/hooks.server.ts
category: source
file_type: ts
status: current
last_updated: 2025-11-20
---

# hooks.server.ts

## 개요

**원본 경로**: `src/hooks.server.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * SvelteKit 서버 훅
 *
 * Paraglide i18n 미들웨어:
 * - 요청의 쿠키/헤더에서 사용자 로케일 자동 감지
 * - 감지된 로케일을 요청 컨텍스트에 설정
 * - HTML lang 속성 자동 설정
 */

import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

export const handle: Handle = handleParaglide;
```
