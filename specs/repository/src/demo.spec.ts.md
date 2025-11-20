---
title: demo.spec.ts - TypeScript 소스 코드
original_path: src/demo.spec.ts
category: source
file_type: ts
status: current
last_updated: 2025-11-20
---

# demo.spec.ts

## 개요

**원본 경로**: `src/demo.spec.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
import { describe, it, expect } from 'vitest';

describe('sum test', () => {
	it('adds 1 + 2 to equal 3', () => {
		expect(1 + 2).toBe(3);
	});
});
```
