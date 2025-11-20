---
title: boardwritepost2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/boardwritepost2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# boardwritepost2.js

## 개요

**원본 경로**: `src/paraglide/messages/boardwritepost2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_boardwritepost2 = /** @type {(inputs: {}) => string} */ () => {
	return `Write Post`
};

const ko_boardwritepost2 = /** @type {(inputs: {}) => string} */ () => {
	return `글쓰기`
};

const ja_boardwritepost2 = /** @type {(inputs: {}) => string} */ () => {
	return `投稿を書く`
};

const zh_boardwritepost2 = /** @type {(inputs: {}) => string} */ () => {
	return `写帖子`
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
const boardwritepost2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.boardwritepost2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("boardwritepost2", locale)
	if (locale === "en") return en_boardwritepost2(inputs)
	if (locale === "ko") return ko_boardwritepost2(inputs)
	if (locale === "ja") return ja_boardwritepost2(inputs)
	return zh_boardwritepost2(inputs)
};
export { boardwritepost2 as "boardWritePost" }
```
