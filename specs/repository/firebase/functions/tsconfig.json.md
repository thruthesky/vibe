---
title: tsconfig.json - JSON 설정 파일
original_path: firebase/functions/tsconfig.json
category: configuration
file_type: json
status: current
last_updated: 2025-11-20
---

# tsconfig.json

## 개요

**원본 경로**: `firebase/functions/tsconfig.json`

**파일 유형**: JSON 설정 파일

## 소스 코드

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "baseUrl": ".",
    "paths": {
      "@functions/*": ["../../src/lib/functions/*"],
      "@shared/*": ["../../shared/*"]
    },
    "rootDirs": [
      "./src",
      "../../src/lib/functions",
      "../../shared"
    ],
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "compileOnSave": true,
  "include": [
    "src",
    "scripts",
    "../../shared/**/*.ts"
  ]
}
```
