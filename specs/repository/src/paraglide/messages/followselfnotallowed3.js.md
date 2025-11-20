---
title: followselfnotallowed3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/followselfnotallowed3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# followselfnotallowed3.js

## 개요

**원본 경로**: `src/paraglide/messages/followselfnotallowed3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_followselfnotallowed3 = /** @type {(inputs: {}) => string} */ () => {
	return `You cannot follow yourself`
};

const ko_followselfnotallowed3 = /** @type {(inputs: {}) => string} */ () => {
	return `자기 자신을 팔로우할 수 없습니다`
};

const ja_followselfnotallowed3 = /** @type {(inputs: {}) => string} */ () => {
	return `自分自身をフォローできません`
};

const zh_followselfnotallowed3 = /** @type {(inputs: {}) => string} */ () => {
	return `不能关注自己`
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
const followselfnotallowed3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.followselfnotallowed3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("followselfnotallowed3", locale)
	if (locale === "en") return en_followselfnotallowed3(inputs)
	if (locale === "ko") return ko_followselfnotallowed3(inputs)
	if (locale === "ja") return ja_followselfnotallowed3(inputs)
	return zh_followselfnotallowed3(inputs)
};
export { followselfnotallowed3 as "followSelfNotAllowed" }
```
