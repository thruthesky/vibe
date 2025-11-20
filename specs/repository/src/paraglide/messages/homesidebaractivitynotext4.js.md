---
title: homesidebaractivitynotext4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebaractivitynotext4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebaractivitynotext4.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebaractivitynotext4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebaractivitynotext4 = /** @type {(inputs: {}) => string} */ () => {
	return `Attachment only`
};

const ko_homesidebaractivitynotext4 = /** @type {(inputs: {}) => string} */ () => {
	return `텍스트 없이 첨부만 있습니다.`
};

const ja_homesidebaractivitynotext4 = /** @type {(inputs: {}) => string} */ () => {
	return `添付のみの投稿`
};

const zh_homesidebaractivitynotext4 = /** @type {(inputs: {}) => string} */ () => {
	return `仅有附件`
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
const homesidebaractivitynotext4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebaractivitynotext4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebaractivitynotext4", locale)
	if (locale === "en") return en_homesidebaractivitynotext4(inputs)
	if (locale === "ko") return ko_homesidebaractivitynotext4(inputs)
	if (locale === "ja") return ja_homesidebaractivitynotext4(inputs)
	return zh_homesidebaractivitynotext4(inputs)
};
export { homesidebaractivitynotext4 as "homeSidebarActivityNoText" }
```
