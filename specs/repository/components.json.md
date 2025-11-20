---
title: components.json - JSON 설정 파일
original_path: components.json
category: configuration
file_type: json
status: current
last_updated: 2025-11-20
---

# components.json

## 개요

**원본 경로**: `components.json`

**파일 유형**: JSON 설정 파일

## 소스 코드

```json
{
	"$schema": "https://shadcn-svelte.com/schema.json",
	"style": "default",
	"tailwind": {
		"config": "tailwind.config.js",
		"css": "src/app.css",
		"baseColor": "slate"
	},
	"aliases": {
		"components": "$lib/components",
		"utils": "$lib/utils"
	}
}
```
