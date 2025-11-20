---
title: followercount1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/followercount1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# followercount1.js

## 개요

**원본 경로**: `src/paraglide/messages/followercount1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_followercount1 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.count} Followers`
};

const ko_followercount1 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `팔로워 ${i.count}명`
};

const ja_followercount1 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `フォロワー${i.count}人`
};

const zh_followercount1 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.count}个粉丝`
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
const followercount1 = (inputs, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.followercount1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("followercount1", locale)
	if (locale === "en") return en_followercount1(inputs)
	if (locale === "ko") return ko_followercount1(inputs)
	if (locale === "ja") return ja_followercount1(inputs)
	return zh_followercount1(inputs)
};
export { followercount1 as "followerCount" }
```
