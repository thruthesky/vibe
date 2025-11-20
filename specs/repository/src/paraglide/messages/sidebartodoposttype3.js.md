---
title: sidebartodoposttype3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/sidebartodoposttype3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# sidebartodoposttype3.js

## 개요

**원본 경로**: `src/paraglide/messages/sidebartodoposttype3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_sidebartodoposttype3 = /** @type {(inputs: {}) => string} */ () => {
	return `Board post-type messages`
};

const ko_sidebartodoposttype3 = /** @type {(inputs: {}) => string} */ () => {
	return `게시판 Post 타입 메시지`
};

const ja_sidebartodoposttype3 = /** @type {(inputs: {}) => string} */ () => {
	return `掲示板ポスト型メッセージ`
};

const zh_sidebartodoposttype3 = /** @type {(inputs: {}) => string} */ () => {
	return `论坛帖子类型消息`
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
const sidebartodoposttype3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.sidebartodoposttype3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("sidebartodoposttype3", locale)
	if (locale === "en") return en_sidebartodoposttype3(inputs)
	if (locale === "ko") return ko_sidebartodoposttype3(inputs)
	if (locale === "ja") return ja_sidebartodoposttype3(inputs)
	return zh_sidebartodoposttype3(inputs)
};
export { sidebartodoposttype3 as "sidebarTodoPostType" }
```
