---
title: profilepostcount2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/profilepostcount2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# profilepostcount2.js

## 개요

**원본 경로**: `src/paraglide/messages/profilepostcount2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_profilepostcount2 = /** @type {(inputs: {}) => string} */ () => {
	return `Posts`
};

const ko_profilepostcount2 = /** @type {(inputs: {}) => string} */ () => {
	return `게시글`
};

const ja_profilepostcount2 = /** @type {(inputs: {}) => string} */ () => {
	return `投稿`
};

const zh_profilepostcount2 = /** @type {(inputs: {}) => string} */ () => {
	return `帖子`
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
const profilepostcount2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.profilepostcount2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("profilepostcount2", locale)
	if (locale === "en") return en_profilepostcount2(inputs)
	if (locale === "ko") return ko_profilepostcount2(inputs)
	if (locale === "ja") return ja_profilepostcount2(inputs)
	return zh_profilepostcount2(inputs)
};
export { profilepostcount2 as "profilePostCount" }
```
