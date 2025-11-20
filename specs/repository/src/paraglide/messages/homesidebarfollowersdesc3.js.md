---
title: homesidebarfollowersdesc3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebarfollowersdesc3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebarfollowersdesc3.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebarfollowersdesc3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebarfollowersdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `People who follow you`
};

const ko_homesidebarfollowersdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `나를 팔로우하는 사용자`
};

const ja_homesidebarfollowersdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `あなたをフォローしているユーザー`
};

const zh_homesidebarfollowersdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `关注你的用户`
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
const homesidebarfollowersdesc3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebarfollowersdesc3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebarfollowersdesc3", locale)
	if (locale === "en") return en_homesidebarfollowersdesc3(inputs)
	if (locale === "ko") return ko_homesidebarfollowersdesc3(inputs)
	if (locale === "ja") return ja_homesidebarfollowersdesc3(inputs)
	return zh_homesidebarfollowersdesc3(inputs)
};
export { homesidebarfollowersdesc3 as "homeSidebarFollowersDesc" }
```
