---
title: influencerscore1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/influencerscore1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# influencerscore1.js

## 개요

**원본 경로**: `src/paraglide/messages/influencerscore1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_influencerscore1 = /** @type {(inputs: {}) => string} */ () => {
	return `Score:`
};

const ko_influencerscore1 = /** @type {(inputs: {}) => string} */ () => {
	return `점수:`
};

const ja_influencerscore1 = /** @type {(inputs: {}) => string} */ () => {
	return `スコア:`
};

const zh_influencerscore1 = /** @type {(inputs: {}) => string} */ () => {
	return `积分:`
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
const influencerscore1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.influencerscore1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("influencerscore1", locale)
	if (locale === "en") return en_influencerscore1(inputs)
	if (locale === "ko") return ko_influencerscore1(inputs)
	if (locale === "ja") return ja_influencerscore1(inputs)
	return zh_influencerscore1(inputs)
};
export { influencerscore1 as "influencerScore" }
```
