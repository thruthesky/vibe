---
title: page.svelte.spec.ts - TypeScript 소스 코드
original_path: src/routes/page.svelte.spec.ts
category: route
file_type: ts
status: current
last_updated: 2025-11-20
---

# page.svelte.spec.ts

## 개요

**원본 경로**: `src/routes/page.svelte.spec.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});
});
```
