---
title: popularpostsweekly2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/popularpostsweekly2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# popularpostsweekly2.js

## 개요

**원본 경로**: `src/paraglide/messages/popularpostsweekly2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_popularpostsweekly2 = /** @type {(inputs: {}) => string} */ () => {
	return `Weekly`
};

const ko_popularpostsweekly2 = /** @type {(inputs: {}) => string} */ () => {
	return `주간`
};

const ja_popularpostsweekly2 = /** @type {(inputs: {}) => string} */ () => {
	return `週間`
};

const zh_popularpostsweekly2 = /** @type {(inputs: {}) => string} */ () => {
	return `每周`
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
const popularpostsweekly2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.popularpostsweekly2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("popularpostsweekly2", locale)
	if (locale === "en") return en_popularpostsweekly2(inputs)
	if (locale === "ko") return ko_popularpostsweekly2(inputs)
	if (locale === "ja") return ja_popularpostsweekly2(inputs)
	return zh_popularpostsweekly2(inputs)
};
export { popularpostsweekly2 as "popularPostsWeekly" }
```
