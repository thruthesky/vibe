---
title: homesectionrecentpostsdesc4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesectionrecentpostsdesc4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesectionrecentpostsdesc4.js

## 개요

**원본 경로**: `src/paraglide/messages/homesectionrecentpostsdesc4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesectionrecentpostsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `A snapshot of the board’s newest posts and replies is coming here.`
};

const ko_homesectionrecentpostsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `게시판의 최신 글과 댓글을 한눈에 볼 수 있도록 준비 중입니다.`
};

const ja_homesectionrecentpostsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `掲示板の最新投稿とコメントをまとめて確認できるよう準備中です。`
};

const zh_homesectionrecentpostsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `稍后将在此展示论坛最新的帖子和评论概览。`
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
const homesectionrecentpostsdesc4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesectionrecentpostsdesc4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesectionrecentpostsdesc4", locale)
	if (locale === "en") return en_homesectionrecentpostsdesc4(inputs)
	if (locale === "ko") return ko_homesectionrecentpostsdesc4(inputs)
	if (locale === "ja") return ja_homesectionrecentpostsdesc4(inputs)
	return zh_homesectionrecentpostsdesc4(inputs)
};
export { homesectionrecentpostsdesc4 as "homeSectionRecentPostsDesc" }
```
