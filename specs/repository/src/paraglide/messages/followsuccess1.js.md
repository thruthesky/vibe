---
title: followsuccess1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/followsuccess1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# followsuccess1.js

## 개요

**원본 경로**: `src/paraglide/messages/followsuccess1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_followsuccess1 = /** @type {(inputs: {}) => string} */ () => {
	return `Followed successfully`
};

const ko_followsuccess1 = /** @type {(inputs: {}) => string} */ () => {
	return `팔로우했습니다`
};

const ja_followsuccess1 = /** @type {(inputs: {}) => string} */ () => {
	return `フォローしました`
};

const zh_followsuccess1 = /** @type {(inputs: {}) => string} */ () => {
	return `关注成功`
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
const followsuccess1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.followsuccess1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("followsuccess1", locale)
	if (locale === "en") return en_followsuccess1(inputs)
	if (locale === "ko") return ko_followsuccess1(inputs)
	if (locale === "ja") return ja_followsuccess1(inputs)
	return zh_followsuccess1(inputs)
};
export { followsuccess1 as "followSuccess" }
```
