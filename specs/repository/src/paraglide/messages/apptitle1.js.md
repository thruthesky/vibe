---
title: apptitle1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/apptitle1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# apptitle1.js

## 개요

**원본 경로**: `src/paraglide/messages/apptitle1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const ko_apptitle1 = /** @type {(inputs: {}) => string} */ () => {
	return `소너브`
};

/** @type {(inputs: {}) => string} */
const en_apptitle1 = () => 'appTitle'

/** @type {(inputs: {}) => string} */
const ja_apptitle1 = en_apptitle1;

/** @type {(inputs: {}) => string} */
const zh_apptitle1 = en_apptitle1;

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
const apptitle1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.apptitle1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("apptitle1", locale)
	if (locale === "en") return en_apptitle1(inputs)
	if (locale === "ko") return ko_apptitle1(inputs)
	if (locale === "ja") return ja_apptitle1(inputs)
	return zh_apptitle1(inputs)
};
export { apptitle1 as "appTitle" }
```
