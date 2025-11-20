---
title: homesidebaropenchatsubtitle4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebaropenchatsubtitle4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebaropenchatsubtitle4.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebaropenchatsubtitle4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebaropenchatsubtitle4 = /** @type {(inputs: {}) => string} */ () => {
	return `Newest public open chat rooms`
};

const ko_homesidebaropenchatsubtitle4 = /** @type {(inputs: {}) => string} */ () => {
	return `최근 개설된 오픈 채팅방`
};

const ja_homesidebaropenchatsubtitle4 = /** @type {(inputs: {}) => string} */ () => {
	return `最新の公開オープンチャット`
};

const zh_homesidebaropenchatsubtitle4 = /** @type {(inputs: {}) => string} */ () => {
	return `最新开放聊天室`
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
const homesidebaropenchatsubtitle4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebaropenchatsubtitle4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebaropenchatsubtitle4", locale)
	if (locale === "en") return en_homesidebaropenchatsubtitle4(inputs)
	if (locale === "ko") return ko_homesidebaropenchatsubtitle4(inputs)
	if (locale === "ja") return ja_homesidebaropenchatsubtitle4(inputs)
	return zh_homesidebaropenchatsubtitle4(inputs)
};
export { homesidebaropenchatsubtitle4 as "homeSidebarOpenChatSubtitle" }
```
