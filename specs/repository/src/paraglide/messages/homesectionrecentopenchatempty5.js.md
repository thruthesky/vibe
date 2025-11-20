---
title: homesectionrecentopenchatempty5.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesectionrecentopenchatempty5.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesectionrecentopenchatempty5.js

## 개요

**원본 경로**: `src/paraglide/messages/homesectionrecentopenchatempty5.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesectionrecentopenchatempty5 = /** @type {(inputs: {}) => string} */ () => {
	return `No recent open chat messages yet.`
};

const ko_homesectionrecentopenchatempty5 = /** @type {(inputs: {}) => string} */ () => {
	return `최근 오픈 채팅 메시지가 없습니다.`
};

const ja_homesectionrecentopenchatempty5 = /** @type {(inputs: {}) => string} */ () => {
	return `最近のオープンチャットメッセージはありません。`
};

const zh_homesectionrecentopenchatempty5 = /** @type {(inputs: {}) => string} */ () => {
	return `最近没有开放聊天室消息。`
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
const homesectionrecentopenchatempty5 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesectionrecentopenchatempty5(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesectionrecentopenchatempty5", locale)
	if (locale === "en") return en_homesectionrecentopenchatempty5(inputs)
	if (locale === "ko") return ko_homesectionrecentopenchatempty5(inputs)
	if (locale === "ja") return ja_homesectionrecentopenchatempty5(inputs)
	return zh_homesectionrecentopenchatempty5(inputs)
};
export { homesectionrecentopenchatempty5 as "homeSectionRecentOpenChatEmpty" }
```
