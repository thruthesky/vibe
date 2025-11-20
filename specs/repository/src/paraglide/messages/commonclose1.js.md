---
title: commonclose1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/commonclose1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# commonclose1.js

## 개요

**원본 경로**: `src/paraglide/messages/commonclose1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_commonclose1 = /** @type {(inputs: {}) => string} */ () => {
	return `Close`
};

const ko_commonclose1 = /** @type {(inputs: {}) => string} */ () => {
	return `닫기`
};

const ja_commonclose1 = /** @type {(inputs: {}) => string} */ () => {
	return `閉じる`
};

const zh_commonclose1 = /** @type {(inputs: {}) => string} */ () => {
	return `关闭`
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
const commonclose1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.commonclose1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("commonclose1", locale)
	if (locale === "en") return en_commonclose1(inputs)
	if (locale === "ko") return ko_commonclose1(inputs)
	if (locale === "ja") return ja_commonclose1(inputs)
	return zh_commonclose1(inputs)
};
export { commonclose1 as "commonClose" }
```
