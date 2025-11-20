---
title: homesidebarstatsdesc3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebarstatsdesc3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebarstatsdesc3.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebarstatsdesc3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebarstatsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `Daily totals for followers, likes, and comments`
};

const ko_homesidebarstatsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `팔로워·좋아요·댓글을 일 단위로 확인`
};

const ja_homesidebarstatsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `フォロワー・いいね・コメントの日別推移`
};

const zh_homesidebarstatsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `按天查看粉丝、点赞、评论总数`
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
const homesidebarstatsdesc3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebarstatsdesc3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebarstatsdesc3", locale)
	if (locale === "en") return en_homesidebarstatsdesc3(inputs)
	if (locale === "ko") return ko_homesidebarstatsdesc3(inputs)
	if (locale === "ja") return ja_homesidebarstatsdesc3(inputs)
	return zh_homesidebarstatsdesc3(inputs)
};
export { homesidebarstatsdesc3 as "homeSidebarStatsDesc" }
```
