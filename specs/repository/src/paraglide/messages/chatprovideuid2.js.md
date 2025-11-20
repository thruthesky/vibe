---
title: chatprovideuid2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatprovideuid2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatprovideuid2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatprovideuid2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatprovideuid2 = /** @type {(inputs: {}) => string} */ () => {
	return `Provide a uid query parameter to open a single chat.`
};

const ko_chatprovideuid2 = /** @type {(inputs: {}) => string} */ () => {
	return `단일 채팅을 열려면 uid 쿼리 매개변수를 제공하세요.`
};

const ja_chatprovideuid2 = /** @type {(inputs: {}) => string} */ () => {
	return `ダイレクトチャットを開くにはuidクエリパラメータを指定してください。`
};

const zh_chatprovideuid2 = /** @type {(inputs: {}) => string} */ () => {
	return `请提供uid查询参数以打开单聊。`
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
const chatprovideuid2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatprovideuid2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatprovideuid2", locale)
	if (locale === "en") return en_chatprovideuid2(inputs)
	if (locale === "ko") return ko_chatprovideuid2(inputs)
	if (locale === "ja") return ja_chatprovideuid2(inputs)
	return zh_chatprovideuid2(inputs)
};
export { chatprovideuid2 as "chatProvideUid" }
```
