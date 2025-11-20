---
title: likeusersempty2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/likeusersempty2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# likeusersempty2.js

## 개요

**원본 경로**: `src/paraglide/messages/likeusersempty2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const ko_likeusersempty2 = /** @type {(inputs: {}) => string} */ () => {
	return `좋아요한 사용자가 없습니다`
};

const zh_likeusersempty2 = /** @type {(inputs: {}) => string} */ () => {
	return `没有点赞的用户`
};

/** @type {(inputs: {}) => string} */
const en_likeusersempty2 = () => 'likeUsersEmpty'

/** @type {(inputs: {}) => string} */
const ja_likeusersempty2 = en_likeusersempty2;

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
const likeusersempty2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.likeusersempty2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("likeusersempty2", locale)
	if (locale === "en") return en_likeusersempty2(inputs)
	if (locale === "ko") return ko_likeusersempty2(inputs)
	if (locale === "ja") return ja_likeusersempty2(inputs)
	return zh_likeusersempty2(inputs)
};
export { likeusersempty2 as "likeUsersEmpty" }
```
