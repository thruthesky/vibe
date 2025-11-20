---
title: followingcount1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/followingcount1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# followingcount1.js

## 개요

**원본 경로**: `src/paraglide/messages/followingcount1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_followingcount1 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.count} Following`
};

const ko_followingcount1 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `팔로잉 ${i.count}명`
};

const ja_followingcount1 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `フォロー中${i.count}人`
};

const zh_followingcount1 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `关注${i.count}个`
};

/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. `en.json`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* 
* @param {{ count: NonNullable<unknown> }} inputs
* @param {{ locale?: "en" | "ko" | "ja" | "zh" }} options
* @returns {string}
*/
/* @__NO_SIDE_EFFECTS__ */
const followingcount1 = (inputs, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.followingcount1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("followingcount1", locale)
	if (locale === "en") return en_followingcount1(inputs)
	if (locale === "ko") return ko_followingcount1(inputs)
	if (locale === "ja") return ja_followingcount1(inputs)
	return zh_followingcount1(inputs)
};
export { followingcount1 as "followingCount" }
```
