---
title: vitest.config.ts - TypeScript 소스 코드
original_path: firebase/functions/vitest.config.ts
category: source
file_type: ts
status: current
last_updated: 2025-11-20
---

# vitest.config.ts

## 개요

**원본 경로**: `firebase/functions/vitest.config.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
import {defineConfig} from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000, // 30초 타임아웃 (Firebase 작업용)
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```
