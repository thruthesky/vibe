---
title: followerslist1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/followerslist1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# followerslist1.js

## 개요

**원본 경로**: `src/paraglide/messages/followerslist1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_followerslist1 = /** @type {(inputs: {}) => string} */ () => {
	return `Followers List`
};

const ko_followerslist1 = /** @type {(inputs: {}) => string} */ () => {
	return `팔로워 목록`
};

const ja_followerslist1 = /** @type {(inputs: {}) => string} */ () => {
	return `フォロワーリスト`
};

const zh_followerslist1 = /** @type {(inputs: {}) => string} */ () => {
	return `粉丝列表`
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
const followerslist1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.followerslist1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("followerslist1", locale)
	if (locale === "en") return en_followerslist1(inputs)
	if (locale === "ko") return ko_followerslist1(inputs)
	if (locale === "ja") return ja_followerslist1(inputs)
	return zh_followerslist1(inputs)
};
export { followerslist1 as "followersList" }
```
