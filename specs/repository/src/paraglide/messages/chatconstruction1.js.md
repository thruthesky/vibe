---
title: chatconstruction1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatconstruction1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatconstruction1.js

## 개요

**원본 경로**: `src/paraglide/messages/chatconstruction1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatconstruction1 = /** @type {(inputs: {}) => string} */ () => {
	return `Chat feature is currently under development.`
};

const ko_chatconstruction1 = /** @type {(inputs: {}) => string} */ () => {
	return `채팅 기능은 현재 개발 중입니다.`
};

const ja_chatconstruction1 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット機能は現在開発中です。`
};

const zh_chatconstruction1 = /** @type {(inputs: {}) => string} */ () => {
	return `聊天功能目前正在开发中。`
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
const chatconstruction1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatconstruction1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatconstruction1", locale)
	if (locale === "en") return en_chatconstruction1(inputs)
	if (locale === "ko") return ko_chatconstruction1(inputs)
	if (locale === "ja") return ja_chatconstruction1(inputs)
	return zh_chatconstruction1(inputs)
};
export { chatconstruction1 as "chatConstruction" }
```
