---
title: followinglist1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/followinglist1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# followinglist1.js

## 개요

**원본 경로**: `src/paraglide/messages/followinglist1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_followinglist1 = /** @type {(inputs: {}) => string} */ () => {
	return `Following List`
};

const ko_followinglist1 = /** @type {(inputs: {}) => string} */ () => {
	return `팔로잉 목록`
};

const ja_followinglist1 = /** @type {(inputs: {}) => string} */ () => {
	return `フォロー中リスト`
};

const zh_followinglist1 = /** @type {(inputs: {}) => string} */ () => {
	return `关注列表`
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
const followinglist1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.followinglist1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("followinglist1", locale)
	if (locale === "en") return en_followinglist1(inputs)
	if (locale === "ko") return ko_followinglist1(inputs)
	if (locale === "ja") return ja_followinglist1(inputs)
	return zh_followinglist1(inputs)
};
export { followinglist1 as "followingList" }
```
