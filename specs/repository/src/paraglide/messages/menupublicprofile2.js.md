---
title: menupublicprofile2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/menupublicprofile2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# menupublicprofile2.js

## 개요

**원본 경로**: `src/paraglide/messages/menupublicprofile2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_menupublicprofile2 = /** @type {(inputs: {}) => string} */ () => {
	return `Public Profile`
};

const ko_menupublicprofile2 = /** @type {(inputs: {}) => string} */ () => {
	return `공개 프로필`
};

const ja_menupublicprofile2 = /** @type {(inputs: {}) => string} */ () => {
	return `公開プロフィール`
};

const zh_menupublicprofile2 = /** @type {(inputs: {}) => string} */ () => {
	return `公开资料`
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
const menupublicprofile2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.menupublicprofile2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("menupublicprofile2", locale)
	if (locale === "en") return en_menupublicprofile2(inputs)
	if (locale === "ko") return ko_menupublicprofile2(inputs)
	if (locale === "ja") return ja_menupublicprofile2(inputs)
	return zh_menupublicprofile2(inputs)
};
export { menupublicprofile2 as "menuPublicProfile" }
```
