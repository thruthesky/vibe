---
title: homesectionrecentopenchatdesc5.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesectionrecentopenchatdesc5.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesectionrecentopenchatdesc5.js

## 개요

**원본 경로**: `src/paraglide/messages/homesectionrecentopenchatdesc5.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesectionrecentopenchatdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `Live open chat conversations will be streamed in this space.`
};

const ko_homesectionrecentopenchatdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `실시간 오픈 채팅 메시지를 곧 확인할 수 있습니다.`
};

const ja_homesectionrecentopenchatdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `リアルタイムのオープンチャットをこの領域に表示予定です。`
};

const zh_homesectionrecentopenchatdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `实时开放聊天室对话即将展示在此区域。`
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
const homesectionrecentopenchatdesc5 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesectionrecentopenchatdesc5(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesectionrecentopenchatdesc5", locale)
	if (locale === "en") return en_homesectionrecentopenchatdesc5(inputs)
	if (locale === "ko") return ko_homesectionrecentopenchatdesc5(inputs)
	if (locale === "ja") return ja_homesectionrecentopenchatdesc5(inputs)
	return zh_homesectionrecentopenchatdesc5(inputs)
};
export { homesectionrecentopenchatdesc5 as "homeSectionRecentOpenChatDesc" }
```
