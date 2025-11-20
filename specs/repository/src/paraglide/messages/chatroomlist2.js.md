---
title: chatroomlist2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatroomlist2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatroomlist2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatroomlist2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatroomlist2 = /** @type {(inputs: {}) => string} */ () => {
	return `My Chats`
};

const ko_chatroomlist2 = /** @type {(inputs: {}) => string} */ () => {
	return `내 채팅`
};

const ja_chatroomlist2 = /** @type {(inputs: {}) => string} */ () => {
	return `マイチャット`
};

const zh_chatroomlist2 = /** @type {(inputs: {}) => string} */ () => {
	return `我的聊天`
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
const chatroomlist2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatroomlist2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatroomlist2", locale)
	if (locale === "en") return en_chatroomlist2(inputs)
	if (locale === "ko") return ko_chatroomlist2(inputs)
	if (locale === "ja") return ja_chatroomlist2(inputs)
	return zh_chatroomlist2(inputs)
};
export { chatroomlist2 as "chatRoomList" }
```
