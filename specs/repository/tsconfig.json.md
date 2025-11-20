---
title: tsconfig.json - JSON 설정 파일
original_path: tsconfig.json
category: configuration
file_type: json
status: current
last_updated: 2025-11-20
---

# tsconfig.json

## 개요

**원본 경로**: `tsconfig.json`

**파일 유형**: JSON 설정 파일

## 소스 코드

```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowImportingTsExtensions": true,
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	},
	"exclude": ["src/paraglide/**/*"]
	// Path aliases are handled by https://svelte.dev/docs/kit/configuration#alias
	// except $lib which is handled by https://svelte.dev/docs/kit/configuration#files
	//
	// To make changes to top-level options such as include and exclude, we recommend extending
	// the generated config; see https://svelte.dev/docs/kit/configuration#typescript
}
```
