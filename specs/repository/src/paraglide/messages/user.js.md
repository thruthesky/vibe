---
title: user.js - JavaScript 소스 코드
original_path: src/paraglide/messages/user.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# user.js

## 개요

**원본 경로**: `src/paraglide/messages/user.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const zh_user = /** @type {(inputs: {}) => string} */ () => {
	return `用户`
};

/** @type {(inputs: {}) => string} */
const en_user = () => 'user'

/** @type {(inputs: {}) => string} */
const ko_user = en_user;

/** @type {(inputs: {}) => string} */
const ja_user = en_user;

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
export const user = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.user(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("user", locale)
	if (locale === "en") return en_user(inputs)
	if (locale === "ko") return ko_user(inputs)
	if (locale === "ja") return ja_user(inputs)
	return zh_user(inputs)
};
```
