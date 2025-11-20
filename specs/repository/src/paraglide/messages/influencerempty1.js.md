---
title: influencerempty1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/influencerempty1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# influencerempty1.js

## 개요

**원본 경로**: `src/paraglide/messages/influencerempty1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_influencerempty1 = /** @type {(inputs: {}) => string} */ () => {
	return `No ranking data yet.`
};

const ko_influencerempty1 = /** @type {(inputs: {}) => string} */ () => {
	return `아직 순위 데이터가 없습니다.`
};

const ja_influencerempty1 = /** @type {(inputs: {}) => string} */ () => {
	return `ランキングデータがまだありません。`
};

const zh_influencerempty1 = /** @type {(inputs: {}) => string} */ () => {
	return `暂时还没有排行数据。`
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
const influencerempty1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.influencerempty1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("influencerempty1", locale)
	if (locale === "en") return en_influencerempty1(inputs)
	if (locale === "ko") return ko_influencerempty1(inputs)
	if (locale === "ja") return ja_influencerempty1(inputs)
	return zh_influencerempty1(inputs)
};
export { influencerempty1 as "influencerEmpty" }
```
