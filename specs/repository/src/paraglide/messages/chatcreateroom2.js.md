---
title: chatcreateroom2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatcreateroom2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatcreateroom2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatcreateroom2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatcreateroom2 = /** @type {(inputs: {}) => string} */ () => {
	return `Create Room`
};

const ko_chatcreateroom2 = /** @type {(inputs: {}) => string} */ () => {
	return `방생성`
};

const ja_chatcreateroom2 = /** @type {(inputs: {}) => string} */ () => {
	return `ルーム作成`
};

const zh_chatcreateroom2 = /** @type {(inputs: {}) => string} */ () => {
	return `创建房间`
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
const chatcreateroom2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatcreateroom2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatcreateroom2", locale)
	if (locale === "en") return en_chatcreateroom2(inputs)
	if (locale === "ko") return ko_chatcreateroom2(inputs)
	if (locale === "ja") return ja_chatcreateroom2(inputs)
	return zh_chatcreateroom2(inputs)
};
export { chatcreateroom2 as "chatCreateRoom" }
```
