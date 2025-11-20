---
title: chatroomlistempty3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatroomlistempty3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatroomlistempty3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatroomlistempty3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatroomlistempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `No chat rooms joined yet.`
};

const ko_chatroomlistempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `참여한 채팅방이 없습니다.`
};

const ja_chatroomlistempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `参加しているチャットルームがありません。`
};

const zh_chatroomlistempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `尚未加入任何聊天室。`
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
const chatroomlistempty3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatroomlistempty3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatroomlistempty3", locale)
	if (locale === "en") return en_chatroomlistempty3(inputs)
	if (locale === "ko") return ko_chatroomlistempty3(inputs)
	if (locale === "ja") return ja_chatroomlistempty3(inputs)
	return zh_chatroomlistempty3(inputs)
};
export { chatroomlistempty3 as "chatRoomListEmpty" }
```
