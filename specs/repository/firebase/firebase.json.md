---
title: firebase.json - JSON 설정 파일
original_path: firebase/firebase.json
category: configuration
file_type: json
status: current
last_updated: 2025-11-20
---

# firebase.json

## 개요

**원본 경로**: `firebase/firebase.json`

**파일 유형**: JSON 설정 파일

## 소스 코드

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "disallowLegacyRuntimeConfig": true,
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run lint",
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ],
  "database": {
    "rules": "database.rules.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```
