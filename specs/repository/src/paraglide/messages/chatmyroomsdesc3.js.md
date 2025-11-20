---
title: chatmyroomsdesc3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatmyroomsdesc3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatmyroomsdesc3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatmyroomsdesc3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatmyroomsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `Chats you joined appear here in chronological order.`
};

const ko_chatmyroomsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `참여한 채팅방이 시간순으로 표시됩니다.`
};

const ja_chatmyroomsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `参加したチャットルームが時系列で表示されます。`
};

const zh_chatmyroomsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `您加入的聊天室按时间顺序显示。`
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
const chatmyroomsdesc3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatmyroomsdesc3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatmyroomsdesc3", locale)
	if (locale === "en") return en_chatmyroomsdesc3(inputs)
	if (locale === "ko") return ko_chatmyroomsdesc3(inputs)
	if (locale === "ja") return ja_chatmyroomsdesc3(inputs)
	return zh_chatmyroomsdesc3(inputs)
};
export { chatmyroomsdesc3 as "chatMyRoomsDesc" }
```
