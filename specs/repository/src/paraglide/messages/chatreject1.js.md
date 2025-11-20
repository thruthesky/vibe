---
title: chatreject1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatreject1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatreject1.js

## 개요

**원본 경로**: `src/paraglide/messages/chatreject1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const ko_chatreject1 = /** @type {(inputs: {}) => string} */ () => {
	return `거절`
};

/** @type {(inputs: {}) => string} */
const en_chatreject1 = () => 'chatReject'

/** @type {(inputs: {}) => string} */
const ja_chatreject1 = en_chatreject1;

/** @type {(inputs: {}) => string} */
const zh_chatreject1 = en_chatreject1;

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
const chatreject1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatreject1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatreject1", locale)
	if (locale === "en") return en_chatreject1(inputs)
	if (locale === "ko") return ko_chatreject1(inputs)
	if (locale === "ja") return ja_chatreject1(inputs)
	return zh_chatreject1(inputs)
};
export { chatreject1 as "chatReject" }
```
