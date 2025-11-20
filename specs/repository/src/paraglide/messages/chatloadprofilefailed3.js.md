---
title: chatloadprofilefailed3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatloadprofilefailed3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatloadprofilefailed3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatloadprofilefailed3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatloadprofilefailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `Failed to load participant profile.`
};

const ko_chatloadprofilefailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `참가자 프로필 로드 실패.`
};

const ja_chatloadprofilefailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `参加者プロフィールの読み込みに失敗しました。`
};

const zh_chatloadprofilefailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `加载参与者资料失败。`
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
const chatloadprofilefailed3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatloadprofilefailed3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatloadprofilefailed3", locale)
	if (locale === "en") return en_chatloadprofilefailed3(inputs)
	if (locale === "ko") return ko_chatloadprofilefailed3(inputs)
	if (locale === "ja") return ja_chatloadprofilefailed3(inputs)
	return zh_chatloadprofilefailed3(inputs)
};
export { chatloadprofilefailed3 as "chatLoadProfileFailed" }
```
