---
title: homesidebarrecentusersempty4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebarrecentusersempty4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebarrecentusersempty4.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebarrecentusersempty4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebarrecentusersempty4 = /** @type {(inputs: {}) => string} */ () => {
	return `No recent photo profiles yet.`
};

const ko_homesidebarrecentusersempty4 = /** @type {(inputs: {}) => string} */ () => {
	return `사진이 있는 신규 가입자가 없습니다.`
};

const ja_homesidebarrecentusersempty4 = /** @type {(inputs: {}) => string} */ () => {
	return `写真付きの新規メンバーがまだいません。`
};

const zh_homesidebarrecentusersempty4 = /** @type {(inputs: {}) => string} */ () => {
	return `暂时没有上传头像的新会员。`
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
const homesidebarrecentusersempty4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebarrecentusersempty4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebarrecentusersempty4", locale)
	if (locale === "en") return en_homesidebarrecentusersempty4(inputs)
	if (locale === "ko") return ko_homesidebarrecentusersempty4(inputs)
	if (locale === "ja") return ja_homesidebarrecentusersempty4(inputs)
	return zh_homesidebarrecentusersempty4(inputs)
};
export { homesidebarrecentusersempty4 as "homeSidebarRecentUsersEmpty" }
```
