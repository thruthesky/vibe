---
title: sidebartodoposttypedesc4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/sidebartodoposttypedesc4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# sidebartodoposttypedesc4.js

## 개요

**원본 경로**: `src/paraglide/messages/sidebartodoposttypedesc4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_sidebartodoposttypedesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `Prepare the composer with category, title, and comment UI for board-style posts.`
};

const ko_sidebartodoposttypedesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `카테고리/제목/댓글을 갖춘 게시판형 메시지 입력 UI를 준비합니다.`
};

const ja_sidebartodoposttypedesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `カテゴリ・タイトル・コメントUIを備えた掲示板スタイルの投稿作成を準備します。`
};

const zh_sidebartodoposttypedesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `准备包含分类、标题和评论 UI 的帖子式发送组件。`
};

/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. `en.json`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* 
* @param {{}} inputs
* @param {{ locale?: "en" | "ko" | "ja" | "zh" }} options
* @returns {string}
*/
/* @__NO_SIDE_EFFECTS__ */
const sidebartodoposttypedesc4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.sidebartodoposttypedesc4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("sidebartodoposttypedesc4", locale)
	if (locale === "en") return en_sidebartodoposttypedesc4(inputs)
	if (locale === "ko") return ko_sidebartodoposttypedesc4(inputs)
	if (locale === "ja") return ja_sidebartodoposttypedesc4(inputs)
	return zh_sidebartodoposttypedesc4(inputs)
};
export { sidebartodoposttypedesc4 as "sidebarTodoPostTypeDesc" }
```
