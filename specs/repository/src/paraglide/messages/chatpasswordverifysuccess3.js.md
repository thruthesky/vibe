---
title: chatpasswordverifysuccess3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatpasswordverifysuccess3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatpasswordverifysuccess3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatpasswordverifysuccess3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatpasswordverifysuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `Password verified`
};

const ko_chatpasswordverifysuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `비밀번호가 확인되었습니다`
};

const ja_chatpasswordverifysuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードが確認されました`
};

const zh_chatpasswordverifysuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `密码已确认`
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
const chatpasswordverifysuccess3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatpasswordverifysuccess3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatpasswordverifysuccess3", locale)
	if (locale === "en") return en_chatpasswordverifysuccess3(inputs)
	if (locale === "ko") return ko_chatpasswordverifysuccess3(inputs)
	if (locale === "ja") return ja_chatpasswordverifysuccess3(inputs)
	return zh_chatpasswordverifysuccess3(inputs)
};
export { chatpasswordverifysuccess3 as "chatPasswordVerifySuccess" }
```
