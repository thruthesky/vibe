---
title: sidebardevhighlightgendersearch4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/sidebardevhighlightgendersearch4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# sidebardevhighlightgendersearch4.js

## 개요

**원본 경로**: `src/paraglide/messages/sidebardevhighlightgendersearch4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_sidebardevhighlightgendersearch4 = /** @type {(inputs: {}) => string} */ () => {
	return `15. Gender-based User Search`
};

const ko_sidebardevhighlightgendersearch4 = /** @type {(inputs: {}) => string} */ () => {
	return `15. 남/여 회원 찾기`
};

const ja_sidebardevhighlightgendersearch4 = /** @type {(inputs: {}) => string} */ () => {
	return `15. 性別検索`
};

const zh_sidebardevhighlightgendersearch4 = /** @type {(inputs: {}) => string} */ () => {
	return `15. 按性别查找用户`
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
const sidebardevhighlightgendersearch4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.sidebardevhighlightgendersearch4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("sidebardevhighlightgendersearch4", locale)
	if (locale === "en") return en_sidebardevhighlightgendersearch4(inputs)
	if (locale === "ko") return ko_sidebardevhighlightgendersearch4(inputs)
	if (locale === "ja") return ja_sidebardevhighlightgendersearch4(inputs)
	return zh_sidebardevhighlightgendersearch4(inputs)
};
export { sidebardevhighlightgendersearch4 as "sidebarDevHighlightGenderSearch" }
```
