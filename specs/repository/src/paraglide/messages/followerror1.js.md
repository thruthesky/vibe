---
title: followerror1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/followerror1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# followerror1.js

## 개요

**원본 경로**: `src/paraglide/messages/followerror1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_followerror1 = /** @type {(inputs: {}) => string} */ () => {
	return `An error occurred while processing follow`
};

const ko_followerror1 = /** @type {(inputs: {}) => string} */ () => {
	return `팔로우 처리 중 오류가 발생했습니다`
};

const ja_followerror1 = /** @type {(inputs: {}) => string} */ () => {
	return `フォロー処理中にエラーが発生しました`
};

const zh_followerror1 = /** @type {(inputs: {}) => string} */ () => {
	return `关注处理时发生错误`
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
const followerror1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.followerror1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("followerror1", locale)
	if (locale === "en") return en_followerror1(inputs)
	if (locale === "ko") return ko_followerror1(inputs)
	if (locale === "ja") return ja_followerror1(inputs)
	return zh_followerror1(inputs)
};
export { followerror1 as "followError" }
```
