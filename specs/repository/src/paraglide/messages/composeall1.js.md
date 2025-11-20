---
title: composeall1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/composeall1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# composeall1.js

## 개요

**원본 경로**: `src/paraglide/messages/composeall1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_composeall1 = /** @type {(inputs: {}) => string} */ () => {
	return `All`
};

const ko_composeall1 = /** @type {(inputs: {}) => string} */ () => {
	return `전체`
};

const ja_composeall1 = /** @type {(inputs: {}) => string} */ () => {
	return `全体`
};

const zh_composeall1 = /** @type {(inputs: {}) => string} */ () => {
	return `全部`
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
const composeall1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.composeall1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("composeall1", locale)
	if (locale === "en") return en_composeall1(inputs)
	if (locale === "ko") return ko_composeall1(inputs)
	if (locale === "ja") return ja_composeall1(inputs)
	return zh_composeall1(inputs)
};
export { composeall1 as "composeAll" }
```
