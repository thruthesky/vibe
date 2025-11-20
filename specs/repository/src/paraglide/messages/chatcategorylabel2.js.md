---
title: chatcategorylabel2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatcategorylabel2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatcategorylabel2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatcategorylabel2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatcategorylabel2 = /** @type {(inputs: {}) => string} */ () => {
	return `Category`
};

const ko_chatcategorylabel2 = /** @type {(inputs: {}) => string} */ () => {
	return `카테고리`
};

const ja_chatcategorylabel2 = /** @type {(inputs: {}) => string} */ () => {
	return `カテゴリ`
};

const zh_chatcategorylabel2 = /** @type {(inputs: {}) => string} */ () => {
	return `分类`
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
const chatcategorylabel2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatcategorylabel2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatcategorylabel2", locale)
	if (locale === "en") return en_chatcategorylabel2(inputs)
	if (locale === "ko") return ko_chatcategorylabel2(inputs)
	if (locale === "ja") return ja_chatcategorylabel2(inputs)
	return zh_chatcategorylabel2(inputs)
};
export { chatcategorylabel2 as "chatCategoryLabel" }
```
