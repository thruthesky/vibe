---
title: chattabfriends2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chattabfriends2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chattabfriends2.js

## 개요

**원본 경로**: `src/paraglide/messages/chattabfriends2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chattabfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `Friends`
};

const ko_chattabfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `친구`
};

const ja_chattabfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `友達`
};

const zh_chattabfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `好友`
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
const chattabfriends2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chattabfriends2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chattabfriends2", locale)
	if (locale === "en") return en_chattabfriends2(inputs)
	if (locale === "ko") return ko_chattabfriends2(inputs)
	if (locale === "ja") return ja_chattabfriends2(inputs)
	return zh_chattabfriends2(inputs)
};
export { chattabfriends2 as "chatTabFriends" }
```
