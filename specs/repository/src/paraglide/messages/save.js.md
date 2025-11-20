---
title: save.js - JavaScript 소스 코드
original_path: src/paraglide/messages/save.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# save.js

## 개요

**원본 경로**: `src/paraglide/messages/save.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const zh_save = /** @type {(inputs: {}) => string} */ () => {
	return `保存`
};

/** @type {(inputs: {}) => string} */
const en_save = () => 'save'

/** @type {(inputs: {}) => string} */
const ko_save = en_save;

/** @type {(inputs: {}) => string} */
const ja_save = en_save;

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
export const save = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.save(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("save", locale)
	if (locale === "en") return en_save(inputs)
	if (locale === "ko") return ko_save(inputs)
	if (locale === "ja") return ja_save(inputs)
	return zh_save(inputs)
};
```
