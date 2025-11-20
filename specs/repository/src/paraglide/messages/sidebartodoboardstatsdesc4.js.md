---
title: sidebartodoboardstatsdesc4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/sidebartodoboardstatsdesc4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# sidebartodoboardstatsdesc4.js

## 개요

**원본 경로**: `src/paraglide/messages/sidebartodoboardstatsdesc4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_sidebartodoboardstatsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `Show live post/comment/like counters for every board category.`
};

const ko_sidebartodoboardstatsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `post·comment·like 카운터를 실시간으로 표시합니다.`
};

const ja_sidebartodoboardstatsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `投稿/コメント/いいね数をリアルタイムで表示します。`
};

const zh_sidebartodoboardstatsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `实时展示帖子/评论/点赞的计数。`
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
const sidebartodoboardstatsdesc4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.sidebartodoboardstatsdesc4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("sidebartodoboardstatsdesc4", locale)
	if (locale === "en") return en_sidebartodoboardstatsdesc4(inputs)
	if (locale === "ko") return ko_sidebartodoboardstatsdesc4(inputs)
	if (locale === "ja") return ja_sidebartodoboardstatsdesc4(inputs)
	return zh_sidebartodoboardstatsdesc4(inputs)
};
export { sidebartodoboardstatsdesc4 as "sidebarTodoBoardStatsDesc" }
```
