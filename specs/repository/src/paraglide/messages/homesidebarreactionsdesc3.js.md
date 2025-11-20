---
title: homesidebarreactionsdesc3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebarreactionsdesc3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebarreactionsdesc3.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebarreactionsdesc3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebarreactionsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `Likes and replies on your posts`
};

const ko_homesidebarreactionsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `내 글과 댓글에 달린 좋아요·댓글 기록`
};

const ja_homesidebarreactionsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `あなたの投稿についたいいねとコメント`
};

const zh_homesidebarreactionsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `查看帖子与评论收到的点赞和回复`
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
const homesidebarreactionsdesc3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebarreactionsdesc3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebarreactionsdesc3", locale)
	if (locale === "en") return en_homesidebarreactionsdesc3(inputs)
	if (locale === "ko") return ko_homesidebarreactionsdesc3(inputs)
	if (locale === "ja") return ja_homesidebarreactionsdesc3(inputs)
	return zh_homesidebarreactionsdesc3(inputs)
};
export { homesidebarreactionsdesc3 as "homeSidebarReactionsDesc" }
```
