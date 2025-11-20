---
title: chatpasswordverifying2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatpasswordverifying2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatpasswordverifying2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatpasswordverifying2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatpasswordverifying2 = /** @type {(inputs: { countdown: NonNullable<unknown> }) => string} */ (i) => {
	return `Verifying... (${i.countdown} seconds left)`
};

const ko_chatpasswordverifying2 = /** @type {(inputs: { countdown: NonNullable<unknown> }) => string} */ (i) => {
	return `검증 중... (${i.countdown}초 남음)`
};

const ja_chatpasswordverifying2 = /** @type {(inputs: { countdown: NonNullable<unknown> }) => string} */ (i) => {
	return `検証中...（残り${i.countdown}秒）`
};

const zh_chatpasswordverifying2 = /** @type {(inputs: { countdown: NonNullable<unknown> }) => string} */ (i) => {
	return `验证中...（剩余${i.countdown}秒）`
};

/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. `en.json`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* 
* @param {{ countdown: NonNullable<unknown> }} inputs
* @param {{ locale?: "en" | "ko" | "ja" | "zh" }} options
* @returns {string}
*/
/* @__NO_SIDE_EFFECTS__ */
const chatpasswordverifying2 = (inputs, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatpasswordverifying2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatpasswordverifying2", locale)
	if (locale === "en") return en_chatpasswordverifying2(inputs)
	if (locale === "ko") return ko_chatpasswordverifying2(inputs)
	if (locale === "ja") return ja_chatpasswordverifying2(inputs)
	return zh_chatpasswordverifying2(inputs)
};
export { chatpasswordverifying2 as "chatPasswordVerifying" }
```
