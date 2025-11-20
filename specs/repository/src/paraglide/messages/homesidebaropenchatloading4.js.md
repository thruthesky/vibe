---
title: homesidebaropenchatloading4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebaropenchatloading4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebaropenchatloading4.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebaropenchatloading4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebaropenchatloading4 = /** @type {(inputs: {}) => string} */ () => {
	return `Loading open chats...`
};

const ko_homesidebaropenchatloading4 = /** @type {(inputs: {}) => string} */ () => {
	return `오픈 채팅을 불러오는 중입니다...`
};

const ja_homesidebaropenchatloading4 = /** @type {(inputs: {}) => string} */ () => {
	return `オープンチャットを読み込み中です...`
};

const zh_homesidebaropenchatloading4 = /** @type {(inputs: {}) => string} */ () => {
	return `正在载入开放聊天室...`
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
const homesidebaropenchatloading4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebaropenchatloading4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebaropenchatloading4", locale)
	if (locale === "en") return en_homesidebaropenchatloading4(inputs)
	if (locale === "ko") return ko_homesidebaropenchatloading4(inputs)
	if (locale === "ja") return ja_homesidebaropenchatloading4(inputs)
	return zh_homesidebaropenchatloading4(inputs)
};
export { homesidebaropenchatloading4 as "homeSidebarOpenChatLoading" }
```
