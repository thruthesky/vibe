---
title: loading.js - JavaScript 소스 코드
original_path: src/paraglide/messages/loading.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# loading.js

## 개요

**원본 경로**: `src/paraglide/messages/loading.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const zh_loading = /** @type {(inputs: {}) => string} */ () => {
	return `加载中...`
};

/** @type {(inputs: {}) => string} */
const en_loading = () => 'loading'

/** @type {(inputs: {}) => string} */
const ko_loading = en_loading;

/** @type {(inputs: {}) => string} */
const ja_loading = en_loading;

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
export const loading = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.loading(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("loading", locale)
	if (locale === "en") return en_loading(inputs)
	if (locale === "ko") return ko_loading(inputs)
	if (locale === "ja") return ja_loading(inputs)
	return zh_loading(inputs)
};
```
