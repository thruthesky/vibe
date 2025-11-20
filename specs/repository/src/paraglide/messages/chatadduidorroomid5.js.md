---
title: chatadduidorroomid5.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatadduidorroomid5.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatadduidorroomid5.js

## 개요

**원본 경로**: `src/paraglide/messages/chatadduidorroomid5.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatadduidorroomid5 = /** @type {(inputs: {}) => string} */ () => {
	return `Add ?uid=TARGET_UID or ?roomId=ROOM_KEY to the URL to open a conversation.`
};

const ko_chatadduidorroomid5 = /** @type {(inputs: {}) => string} */ () => {
	return `대화를 열려면 URL에 ?uid=TARGET_UID 또는 ?roomId=ROOM_KEY를 추가하세요.`
};

const ja_chatadduidorroomid5 = /** @type {(inputs: {}) => string} */ () => {
	return `会話を開くにはURLに?uid=TARGET_UIDまたは?roomId=ROOM_KEYを追加してください。`
};

const zh_chatadduidorroomid5 = /** @type {(inputs: {}) => string} */ () => {
	return `在URL中添加?uid=TARGET_UID或?roomId=ROOM_KEY以打开对话。`
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
const chatadduidorroomid5 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatadduidorroomid5(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatadduidorroomid5", locale)
	if (locale === "en") return en_chatadduidorroomid5(inputs)
	if (locale === "ko") return ko_chatadduidorroomid5(inputs)
	if (locale === "ja") return ja_chatadduidorroomid5(inputs)
	return zh_chatadduidorroomid5(inputs)
};
export { chatadduidorroomid5 as "chatAddUidOrRoomId" }
```
