---
title: testusercreateatonce4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/testusercreateatonce4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# testusercreateatonce4.js

## 개요

**원본 경로**: `src/paraglide/messages/testusercreateatonce4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_testusercreateatonce4 = /** @type {(inputs: {}) => string} */ () => {
	return `Created at once`
};

const ko_testusercreateatonce4 = /** @type {(inputs: {}) => string} */ () => {
	return `한 번에 생성되는 수`
};

const ja_testusercreateatonce4 = /** @type {(inputs: {}) => string} */ () => {
	return `一度に作成される数`
};

const zh_testusercreateatonce4 = /** @type {(inputs: {}) => string} */ () => {
	return `一次创建的数量`
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
const testusercreateatonce4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.testusercreateatonce4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("testusercreateatonce4", locale)
	if (locale === "en") return en_testusercreateatonce4(inputs)
	if (locale === "ko") return ko_testusercreateatonce4(inputs)
	if (locale === "ja") return ja_testusercreateatonce4(inputs)
	return zh_testusercreateatonce4(inputs)
};
export { testusercreateatonce4 as "testUserCreateAtOnce" }
```
