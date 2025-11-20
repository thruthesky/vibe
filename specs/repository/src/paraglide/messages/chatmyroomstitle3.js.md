---
title: chatmyroomstitle3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatmyroomstitle3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatmyroomstitle3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatmyroomstitle3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatmyroomstitle3 = /** @type {(inputs: {}) => string} */ () => {
	return `My conversations`
};

const ko_chatmyroomstitle3 = /** @type {(inputs: {}) => string} */ () => {
	return `내 대화`
};

const ja_chatmyroomstitle3 = /** @type {(inputs: {}) => string} */ () => {
	return `マイ会話`
};

const zh_chatmyroomstitle3 = /** @type {(inputs: {}) => string} */ () => {
	return `我的对话`
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
const chatmyroomstitle3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatmyroomstitle3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatmyroomstitle3", locale)
	if (locale === "en") return en_chatmyroomstitle3(inputs)
	if (locale === "ko") return ko_chatmyroomstitle3(inputs)
	if (locale === "ja") return ja_chatmyroomstitle3(inputs)
	return zh_chatmyroomstitle3(inputs)
};
export { chatmyroomstitle3 as "chatMyRoomsTitle" }
```
