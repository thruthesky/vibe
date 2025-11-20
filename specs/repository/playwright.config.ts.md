---
title: playwright.config.ts - TypeScript 소스 코드
original_path: playwright.config.ts
category: source
file_type: ts
status: current
last_updated: 2025-11-20
---

# playwright.config.ts

## 개요

**원본 경로**: `playwright.config.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	},
	testDir: 'e2e'
});
```
