---
title: homesectionrecentposts3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesectionrecentposts3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesectionrecentposts3.js

## 개요

**원본 경로**: `src/paraglide/messages/homesectionrecentposts3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesectionrecentposts3 = /** @type {(inputs: {}) => string} */ () => {
	return `Latest Posts & Comments`
};

const ko_homesectionrecentposts3 = /** @type {(inputs: {}) => string} */ () => {
	return `최근 글 & 댓글`
};

const ja_homesectionrecentposts3 = /** @type {(inputs: {}) => string} */ () => {
	return `最新の投稿＆コメント`
};

const zh_homesectionrecentposts3 = /** @type {(inputs: {}) => string} */ () => {
	return `最新帖子与评论`
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
const homesectionrecentposts3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesectionrecentposts3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesectionrecentposts3", locale)
	if (locale === "en") return en_homesectionrecentposts3(inputs)
	if (locale === "ko") return ko_homesectionrecentposts3(inputs)
	if (locale === "ja") return ja_homesectionrecentposts3(inputs)
	return zh_homesectionrecentposts3(inputs)
};
export { homesectionrecentposts3 as "homeSectionRecentPosts" }
```
