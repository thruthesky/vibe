---
title: chatcategoryfreediscussion3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatcategoryfreediscussion3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatcategoryfreediscussion3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatcategoryfreediscussion3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatcategoryfreediscussion3 = /** @type {(inputs: {}) => string} */ () => {
	return `Free Discussion`
};

const ko_chatcategoryfreediscussion3 = /** @type {(inputs: {}) => string} */ () => {
	return `자유토론`
};

const ja_chatcategoryfreediscussion3 = /** @type {(inputs: {}) => string} */ () => {
	return `自由討論`
};

const zh_chatcategoryfreediscussion3 = /** @type {(inputs: {}) => string} */ () => {
	return `自由讨论`
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
const chatcategoryfreediscussion3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatcategoryfreediscussion3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatcategoryfreediscussion3", locale)
	if (locale === "en") return en_chatcategoryfreediscussion3(inputs)
	if (locale === "ko") return ko_chatcategoryfreediscussion3(inputs)
	if (locale === "ja") return ja_chatcategoryfreediscussion3(inputs)
	return zh_chatcategoryfreediscussion3(inputs)
};
export { chatcategoryfreediscussion3 as "chatCategoryFreeDiscussion" }
```
