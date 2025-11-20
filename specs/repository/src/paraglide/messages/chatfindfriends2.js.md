---
title: chatfindfriends2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatfindfriends2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatfindfriends2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatfindfriends2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatfindfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `Find Friends`
};

const ko_chatfindfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `친구 찾기`
};

const ja_chatfindfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `友達を探す`
};

const zh_chatfindfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `查找好友`
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
const chatfindfriends2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatfindfriends2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatfindfriends2", locale)
	if (locale === "en") return en_chatfindfriends2(inputs)
	if (locale === "ko") return ko_chatfindfriends2(inputs)
	if (locale === "ja") return ja_chatfindfriends2(inputs)
	return zh_chatfindfriends2(inputs)
};
export { chatfindfriends2 as "chatFindFriends" }
```
