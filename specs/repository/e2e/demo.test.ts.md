---
title: demo.test.ts - TypeScript 소스 코드
original_path: e2e/demo.test.ts
category: source
file_type: ts
status: current
last_updated: 2025-11-20
---

# demo.test.ts

## 개요

**원본 경로**: `e2e/demo.test.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});
```
