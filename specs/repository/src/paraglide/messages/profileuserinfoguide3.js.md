---
title: profileuserinfoguide3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/profileuserinfoguide3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# profileuserinfoguide3.js

## 개요

**원본 경로**: `src/paraglide/messages/profileuserinfoguide3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const zh_profileuserinfoguide3 = /** @type {(inputs: {}) => string} */ () => {
	return `设置您的昵称、性别和出生日期`
};

/** @type {(inputs: {}) => string} */
const en_profileuserinfoguide3 = () => 'profileUserInfoGuide'

/** @type {(inputs: {}) => string} */
const ko_profileuserinfoguide3 = en_profileuserinfoguide3;

/** @type {(inputs: {}) => string} */
const ja_profileuserinfoguide3 = en_profileuserinfoguide3;

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
const profileuserinfoguide3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.profileuserinfoguide3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("profileuserinfoguide3", locale)
	if (locale === "en") return en_profileuserinfoguide3(inputs)
	if (locale === "ko") return ko_profileuserinfoguide3(inputs)
	if (locale === "ja") return ja_profileuserinfoguide3(inputs)
	return zh_profileuserinfoguide3(inputs)
};
export { profileuserinfoguide3 as "profileUserInfoGuide" }
```
