---
title: chataccept1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chataccept1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chataccept1.js

## 개요

**원본 경로**: `src/paraglide/messages/chataccept1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const ko_chataccept1 = /** @type {(inputs: {}) => string} */ () => {
	return `수락`
};

/** @type {(inputs: {}) => string} */
const en_chataccept1 = () => 'chatAccept'

/** @type {(inputs: {}) => string} */
const ja_chataccept1 = en_chataccept1;

/** @type {(inputs: {}) => string} */
const zh_chataccept1 = en_chataccept1;

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
const chataccept1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chataccept1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chataccept1", locale)
	if (locale === "en") return en_chataccept1(inputs)
	if (locale === "ko") return ko_chataccept1(inputs)
	if (locale === "ja") return ja_chataccept1(inputs)
	return zh_chataccept1(inputs)
};
export { chataccept1 as "chatAccept" }
```
