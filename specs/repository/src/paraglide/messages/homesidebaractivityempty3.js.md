---
title: homesidebaractivityempty3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebaractivityempty3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebaractivityempty3.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebaractivityempty3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebaractivityempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `No recent posts yet.`
};

const ko_homesidebaractivityempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `최근 등록된 글이 없습니다.`
};

const ja_homesidebaractivityempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `最新の投稿がまだありません。`
};

const zh_homesidebaractivityempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `暂时没有新的帖子。`
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
const homesidebaractivityempty3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebaractivityempty3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebaractivityempty3", locale)
	if (locale === "en") return en_homesidebaractivityempty3(inputs)
	if (locale === "ko") return ko_homesidebaractivityempty3(inputs)
	if (locale === "ja") return ja_homesidebaractivityempty3(inputs)
	return zh_homesidebaractivityempty3(inputs)
};
export { homesidebaractivityempty3 as "homeSidebarActivityEmpty" }
```
