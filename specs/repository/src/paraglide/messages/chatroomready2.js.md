---
title: chatroomready2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatroomready2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatroomready2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatroomready2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatroomready2 = /** @type {(inputs: { roomId: NonNullable<unknown> }) => string} */ (i) => {
	return `Room ID ${i.roomId} is ready.`
};

const ko_chatroomready2 = /** @type {(inputs: { roomId: NonNullable<unknown> }) => string} */ (i) => {
	return `방 ID ${i.roomId}가 준비되었습니다.`
};

const ja_chatroomready2 = /** @type {(inputs: { roomId: NonNullable<unknown> }) => string} */ (i) => {
	return `ルームID ${i.roomId}が準備完了。`
};

const zh_chatroomready2 = /** @type {(inputs: { roomId: NonNullable<unknown> }) => string} */ (i) => {
	return `房间ID ${i.roomId}已准备就绪。`
};

/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. `en.json`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* 
* @param {{ roomId: NonNullable<unknown> }} inputs
* @param {{ locale?: "en" | "ko" | "ja" | "zh" }} options
* @returns {string}
*/
/* @__NO_SIDE_EFFECTS__ */
const chatroomready2 = (inputs, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatroomready2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatroomready2", locale)
	if (locale === "en") return en_chatroomready2(inputs)
	if (locale === "ko") return ko_chatroomready2(inputs)
	if (locale === "ja") return ja_chatroomready2(inputs)
	return zh_chatroomready2(inputs)
};
export { chatroomready2 as "chatRoomReady" }
```
