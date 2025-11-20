---
title: homesidebarseemore3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebarseemore3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebarseemore3.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebarseemore3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebarseemore3 = /** @type {(inputs: {}) => string} */ () => {
	return `See more`
};

const ko_homesidebarseemore3 = /** @type {(inputs: {}) => string} */ () => {
	return `더보기`
};

const ja_homesidebarseemore3 = /** @type {(inputs: {}) => string} */ () => {
	return `すべて表示`
};

const zh_homesidebarseemore3 = /** @type {(inputs: {}) => string} */ () => {
	return `查看更多`
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
const homesidebarseemore3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebarseemore3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebarseemore3", locale)
	if (locale === "en") return en_homesidebarseemore3(inputs)
	if (locale === "ko") return ko_homesidebarseemore3(inputs)
	if (locale === "ja") return ja_homesidebarseemore3(inputs)
	return zh_homesidebarseemore3(inputs)
};
export { homesidebarseemore3 as "homeSidebarSeeMore" }
```
