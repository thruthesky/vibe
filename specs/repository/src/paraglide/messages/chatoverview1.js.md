---
title: chatoverview1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatoverview1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatoverview1.js

## 개요

**원본 경로**: `src/paraglide/messages/chatoverview1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatoverview1 = /** @type {(inputs: {}) => string} */ () => {
	return `Chat Overview`
};

const ko_chatoverview1 = /** @type {(inputs: {}) => string} */ () => {
	return `채팅 개요`
};

const ja_chatoverview1 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット概要`
};

const zh_chatoverview1 = /** @type {(inputs: {}) => string} */ () => {
	return `聊天概览`
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
const chatoverview1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatoverview1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatoverview1", locale)
	if (locale === "en") return en_chatoverview1(inputs)
	if (locale === "ko") return ko_chatoverview1(inputs)
	if (locale === "ja") return ja_chatoverview1(inputs)
	return zh_chatoverview1(inputs)
};
export { chatoverview1 as "chatOverview" }
```
