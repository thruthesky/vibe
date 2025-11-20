---
title: feedempty1.js - JavaScript 소스 코드
original_path: src/paraglide/messages/feedempty1.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# feedempty1.js

## 개요

**원본 경로**: `src/paraglide/messages/feedempty1.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_feedempty1 = /** @type {(inputs: {}) => string} */ () => {
	return `Your feed is empty. Follow people to fill your feed!`
};

const ko_feedempty1 = /** @type {(inputs: {}) => string} */ () => {
	return `피드가 비어있습니다. 사람들을 팔로우하여 피드를 채워보세요!`
};

const ja_feedempty1 = /** @type {(inputs: {}) => string} */ () => {
	return `フィードが空です。人々をフォローしてフィードを埋めましょう！`
};

const zh_feedempty1 = /** @type {(inputs: {}) => string} */ () => {
	return `您的动态为空。关注一些人来填充您的动态！`
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
const feedempty1 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.feedempty1(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("feedempty1", locale)
	if (locale === "en") return en_feedempty1(inputs)
	if (locale === "ko") return ko_feedempty1(inputs)
	if (locale === "ja") return ja_feedempty1(inputs)
	return zh_feedempty1(inputs)
};
export { feedempty1 as "feedEmpty" }
```
