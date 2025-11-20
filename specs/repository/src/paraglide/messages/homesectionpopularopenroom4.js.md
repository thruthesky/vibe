---
title: homesectionpopularopenroom4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesectionpopularopenroom4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesectionpopularopenroom4.js

## 개요

**원본 경로**: `src/paraglide/messages/homesectionpopularopenroom4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesectionpopularopenroom4 = /** @type {(inputs: {}) => string} */ () => {
	return `Popular Open Chat Rooms`
};

const ko_homesectionpopularopenroom4 = /** @type {(inputs: {}) => string} */ () => {
	return `인기 오픈 채팅방`
};

const ja_homesectionpopularopenroom4 = /** @type {(inputs: {}) => string} */ () => {
	return `人気オープンチャットルーム`
};

const zh_homesectionpopularopenroom4 = /** @type {(inputs: {}) => string} */ () => {
	return `热门开放聊天室`
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
const homesectionpopularopenroom4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesectionpopularopenroom4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesectionpopularopenroom4", locale)
	if (locale === "en") return en_homesectionpopularopenroom4(inputs)
	if (locale === "ko") return ko_homesectionpopularopenroom4(inputs)
	if (locale === "ja") return ja_homesectionpopularopenroom4(inputs)
	return zh_homesectionpopularopenroom4(inputs)
};
export { homesectionpopularopenroom4 as "homeSectionPopularOpenRoom" }
```
