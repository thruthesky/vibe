---
title: chatnomoremessages3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatnomoremessages3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatnomoremessages3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatnomoremessages3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatnomoremessages3 = /** @type {(inputs: {}) => string} */ () => {
	return `No more messages.`
};

const ko_chatnomoremessages3 = /** @type {(inputs: {}) => string} */ () => {
	return `더 이상 메시지가 없습니다.`
};

const ja_chatnomoremessages3 = /** @type {(inputs: {}) => string} */ () => {
	return `これ以上メッセージはありません。`
};

const zh_chatnomoremessages3 = /** @type {(inputs: {}) => string} */ () => {
	return `没有更多消息。`
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
const chatnomoremessages3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatnomoremessages3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatnomoremessages3", locale)
	if (locale === "en") return en_chatnomoremessages3(inputs)
	if (locale === "ko") return ko_chatnomoremessages3(inputs)
	if (locale === "ja") return ja_chatnomoremessages3(inputs)
	return zh_chatnomoremessages3(inputs)
};
export { chatnomoremessages3 as "chatNoMoreMessages" }
```
