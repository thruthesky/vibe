---
title: homesidebaropenchatempty4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebaropenchatempty4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebaropenchatempty4.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebaropenchatempty4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesidebaropenchatempty4 = /** @type {(inputs: {}) => string} */ () => {
	return `No open chat rooms yet.`
};

const ko_homesidebaropenchatempty4 = /** @type {(inputs: {}) => string} */ () => {
	return `아직 오픈 채팅방이 없습니다.`
};

const ja_homesidebaropenchatempty4 = /** @type {(inputs: {}) => string} */ () => {
	return `オープンチャットがまだありません。`
};

const zh_homesidebaropenchatempty4 = /** @type {(inputs: {}) => string} */ () => {
	return `目前还没有开放聊天室。`
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
const homesidebaropenchatempty4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebaropenchatempty4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebaropenchatempty4", locale)
	if (locale === "en") return en_homesidebaropenchatempty4(inputs)
	if (locale === "ko") return ko_homesidebaropenchatempty4(inputs)
	if (locale === "ja") return ja_homesidebaropenchatempty4(inputs)
	return zh_homesidebaropenchatempty4(inputs)
};
export { homesidebaropenchatempty4 as "homeSidebarOpenChatEmpty" }
```
