---
title: chatpasswordsavefailure3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatpasswordsavefailure3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatpasswordsavefailure3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatpasswordsavefailure3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatpasswordsavefailure3 = /** @type {(inputs: {}) => string} */ () => {
	return `Failed to save password`
};

const ko_chatpasswordsavefailure3 = /** @type {(inputs: {}) => string} */ () => {
	return `비밀번호 저장에 실패했습니다`
};

const ja_chatpasswordsavefailure3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードの保存に失敗しました`
};

const zh_chatpasswordsavefailure3 = /** @type {(inputs: {}) => string} */ () => {
	return `保存密码失败`
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
const chatpasswordsavefailure3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatpasswordsavefailure3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatpasswordsavefailure3", locale)
	if (locale === "en") return en_chatpasswordsavefailure3(inputs)
	if (locale === "ko") return ko_chatpasswordsavefailure3(inputs)
	if (locale === "ja") return ja_chatpasswordsavefailure3(inputs)
	return zh_chatpasswordsavefailure3(inputs)
};
export { chatpasswordsavefailure3 as "chatPasswordSaveFailure" }
```
