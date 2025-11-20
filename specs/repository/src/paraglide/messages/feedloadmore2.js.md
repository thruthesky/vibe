---
title: feedloadmore2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/feedloadmore2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# feedloadmore2.js

## 개요

**원본 경로**: `src/paraglide/messages/feedloadmore2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_feedloadmore2 = /** @type {(inputs: {}) => string} */ () => {
	return `Load More`
};

const ko_feedloadmore2 = /** @type {(inputs: {}) => string} */ () => {
	return `더보기`
};

const ja_feedloadmore2 = /** @type {(inputs: {}) => string} */ () => {
	return `さらに読み込む`
};

const zh_feedloadmore2 = /** @type {(inputs: {}) => string} */ () => {
	return `加载更多`
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
const feedloadmore2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.feedloadmore2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("feedloadmore2", locale)
	if (locale === "en") return en_feedloadmore2(inputs)
	if (locale === "ko") return ko_feedloadmore2(inputs)
	if (locale === "ja") return ja_feedloadmore2(inputs)
	return zh_feedloadmore2(inputs)
};
export { feedloadmore2 as "feedLoadMore" }
```
