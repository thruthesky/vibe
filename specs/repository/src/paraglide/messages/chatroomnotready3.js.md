---
title: chatroomnotready3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatroomnotready3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatroomnotready3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatroomnotready3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatroomnotready3 = /** @type {(inputs: {}) => string} */ () => {
	return `Chat room is not ready.`
};

const ko_chatroomnotready3 = /** @type {(inputs: {}) => string} */ () => {
	return `채팅방이 준비되지 않았습니다.`
};

const ja_chatroomnotready3 = /** @type {(inputs: {}) => string} */ () => {
	return `チャットルームが準備されていません。`
};

const zh_chatroomnotready3 = /** @type {(inputs: {}) => string} */ () => {
	return `聊天室未准备就绪。`
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
const chatroomnotready3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatroomnotready3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatroomnotready3", locale)
	if (locale === "en") return en_chatroomnotready3(inputs)
	if (locale === "ko") return ko_chatroomnotready3(inputs)
	if (locale === "ja") return ja_chatroomnotready3(inputs)
	return zh_chatroomnotready3(inputs)
};
export { chatroomnotready3 as "chatRoomNotReady" }
```
