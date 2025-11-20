---
title: feednomore2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/feednomore2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# feednomore2.js

## 개요

**원본 경로**: `src/paraglide/messages/feednomore2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_feednomore2 = /** @type {(inputs: {}) => string} */ () => {
	return `You've reached the end of your feed`
};

const ko_feednomore2 = /** @type {(inputs: {}) => string} */ () => {
	return `모든 피드를 확인했습니다`
};

const ja_feednomore2 = /** @type {(inputs: {}) => string} */ () => {
	return `すべてのフィードを確認しました`
};

const zh_feednomore2 = /** @type {(inputs: {}) => string} */ () => {
	return `已查看所有动态`
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
const feednomore2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.feednomore2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("feednomore2", locale)
	if (locale === "en") return en_feednomore2(inputs)
	if (locale === "ko") return ko_feednomore2(inputs)
	if (locale === "ja") return ja_feednomore2(inputs)
	return zh_feednomore2(inputs)
};
export { feednomore2 as "feedNoMore" }
```
