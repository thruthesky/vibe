---
title: boardtabfree2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/boardtabfree2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# boardtabfree2.js

## 개요

**원본 경로**: `src/paraglide/messages/boardtabfree2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_boardtabfree2 = /** @type {(inputs: {}) => string} */ () => {
	return `Free Talk`
};

const ko_boardtabfree2 = /** @type {(inputs: {}) => string} */ () => {
	return `자유토론`
};

const ja_boardtabfree2 = /** @type {(inputs: {}) => string} */ () => {
	return `自由討論`
};

const zh_boardtabfree2 = /** @type {(inputs: {}) => string} */ () => {
	return `自由讨论`
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
const boardtabfree2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.boardtabfree2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("boardtabfree2", locale)
	if (locale === "en") return en_boardtabfree2(inputs)
	if (locale === "ko") return ko_boardtabfree2(inputs)
	if (locale === "ja") return ja_boardtabfree2(inputs)
	return zh_boardtabfree2(inputs)
};
export { boardtabfree2 as "boardTabFree" }
```
