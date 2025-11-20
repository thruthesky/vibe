---
title: chatpasswordinputplaceholder3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatpasswordinputplaceholder3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatpasswordinputplaceholder3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatpasswordinputplaceholder3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatpasswordinputplaceholder3 = /** @type {(inputs: {}) => string} */ () => {
	return `Password (at least 4 characters)`
};

const ko_chatpasswordinputplaceholder3 = /** @type {(inputs: {}) => string} */ () => {
	return `비밀번호 (최소 4자)`
};

const ja_chatpasswordinputplaceholder3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワード（最低4文字）`
};

const zh_chatpasswordinputplaceholder3 = /** @type {(inputs: {}) => string} */ () => {
	return `密码（至少4个字符）`
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
const chatpasswordinputplaceholder3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatpasswordinputplaceholder3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatpasswordinputplaceholder3", locale)
	if (locale === "en") return en_chatpasswordinputplaceholder3(inputs)
	if (locale === "ko") return ko_chatpasswordinputplaceholder3(inputs)
	if (locale === "ja") return ja_chatpasswordinputplaceholder3(inputs)
	return zh_chatpasswordinputplaceholder3(inputs)
};
export { chatpasswordinputplaceholder3 as "chatPasswordInputPlaceholder" }
```
