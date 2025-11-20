---
title: nofollowers1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/nofollowers1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# nofollowers1.js

## 개요

**원본 경로**: `src/paraglide/messages/nofollowers1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_nofollowers1 = /** @type {(inputs: {}) => string} */ () => {
	return `You have no followers`
};

const ko_nofollowers1 = /** @type {(inputs: {}) => string} */ () => {
	return `팔로워가 없습니다`
};

const ja_nofollowers1 = /** @type {(inputs: {}) => string} */ () => {
	return `フォロワーはいません`
};

const zh_nofollowers1 = /** @type {(inputs: {}) => string} */ () => {
	return `您没有粉丝`
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
const nofollowers1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.nofollowers1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("nofollowers1", locale)
	if (locale === "en") return en_nofollowers1(inputs)
	if (locale === "ko") return ko_nofollowers1(inputs)
	if (locale === "ja") return ja_nofollowers1(inputs)
	return zh_nofollowers1(inputs)
};
export { nofollowers1 as "noFollowers" }
```
