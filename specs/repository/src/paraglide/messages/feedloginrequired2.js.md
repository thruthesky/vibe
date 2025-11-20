---
title: feedloginrequired2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/feedloginrequired2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# feedloginrequired2.js

## 개요

**원본 경로**: `src/paraglide/messages/feedloginrequired2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_feedloginrequired2 = /** @type {(inputs: {}) => string} */ () => {
	return `Login required to view feed`
};

const ko_feedloginrequired2 = /** @type {(inputs: {}) => string} */ () => {
	return `피드를 보려면 로그인이 필요합니다`
};

const ja_feedloginrequired2 = /** @type {(inputs: {}) => string} */ () => {
	return `フィードを表示するにはログインが必要です`
};

const zh_feedloginrequired2 = /** @type {(inputs: {}) => string} */ () => {
	return `需要登录才能查看动态`
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
const feedloginrequired2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.feedloginrequired2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("feedloginrequired2", locale)
	if (locale === "en") return en_feedloginrequired2(inputs)
	if (locale === "ko") return ko_feedloginrequired2(inputs)
	if (locale === "ja") return ja_feedloginrequired2(inputs)
	return zh_feedloginrequired2(inputs)
};
export { feedloginrequired2 as "feedLoginRequired" }
```
