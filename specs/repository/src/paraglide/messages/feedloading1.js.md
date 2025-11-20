---
title: feedloading1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/feedloading1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# feedloading1.js

## 개요

**원본 경로**: `src/paraglide/messages/feedloading1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_feedloading1 = /** @type {(inputs: {}) => string} */ () => {
	return `Loading feed...`
};

const ko_feedloading1 = /** @type {(inputs: {}) => string} */ () => {
	return `피드를 불러오는 중...`
};

const ja_feedloading1 = /** @type {(inputs: {}) => string} */ () => {
	return `フィードを読み込み中...`
};

const zh_feedloading1 = /** @type {(inputs: {}) => string} */ () => {
	return `正在加载动态...`
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
const feedloading1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.feedloading1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("feedloading1", locale)
	if (locale === "en") return en_feedloading1(inputs)
	if (locale === "ko") return ko_feedloading1(inputs)
	if (locale === "ja") return ja_feedloading1(inputs)
	return zh_feedloading1(inputs)
};
export { feedloading1 as "feedLoading" }
```
