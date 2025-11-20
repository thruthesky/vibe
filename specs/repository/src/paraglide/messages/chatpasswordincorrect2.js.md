---
title: chatpasswordincorrect2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatpasswordincorrect2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatpasswordincorrect2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatpasswordincorrect2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatpasswordincorrect2 = /** @type {(inputs: {}) => string} */ () => {
	return `Incorrect password`
};

const ko_chatpasswordincorrect2 = /** @type {(inputs: {}) => string} */ () => {
	return `비밀번호가 올바르지 않습니다`
};

const ja_chatpasswordincorrect2 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードが正しくありません`
};

const zh_chatpasswordincorrect2 = /** @type {(inputs: {}) => string} */ () => {
	return `密码不正确`
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
const chatpasswordincorrect2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatpasswordincorrect2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatpasswordincorrect2", locale)
	if (locale === "en") return en_chatpasswordincorrect2(inputs)
	if (locale === "ko") return ko_chatpasswordincorrect2(inputs)
	if (locale === "ja") return ja_chatpasswordincorrect2(inputs)
	return zh_chatpasswordincorrect2(inputs)
};
export { chatpasswordincorrect2 as "chatPasswordIncorrect" }
```
