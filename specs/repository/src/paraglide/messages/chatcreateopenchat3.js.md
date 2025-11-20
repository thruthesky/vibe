---
title: chatcreateopenchat3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatcreateopenchat3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatcreateopenchat3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatcreateopenchat3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatcreateopenchat3 = /** @type {(inputs: {}) => string} */ () => {
	return `Create Open Chat`
};

const ko_chatcreateopenchat3 = /** @type {(inputs: {}) => string} */ () => {
	return `오픈챗 생성`
};

const ja_chatcreateopenchat3 = /** @type {(inputs: {}) => string} */ () => {
	return `オープンチャット作成`
};

const zh_chatcreateopenchat3 = /** @type {(inputs: {}) => string} */ () => {
	return `创建开放聊天`
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
const chatcreateopenchat3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatcreateopenchat3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatcreateopenchat3", locale)
	if (locale === "en") return en_chatcreateopenchat3(inputs)
	if (locale === "ko") return ko_chatcreateopenchat3(inputs)
	if (locale === "ja") return ja_chatcreateopenchat3(inputs)
	return zh_chatcreateopenchat3(inputs)
};
export { chatcreateopenchat3 as "chatCreateOpenChat" }
```
