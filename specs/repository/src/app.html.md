---
title: app.html - HTML 문서
original_path: src/app.html
category: source
file_type: html
status: current
last_updated: 2025-11-20
---

# app.html

## 개요

**원본 경로**: `src/app.html`

**파일 유형**: HTML 문서

## 소스 코드

```html
<!doctype html>
<html lang="%paraglide.lang%">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="color-scheme" content="light" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```
