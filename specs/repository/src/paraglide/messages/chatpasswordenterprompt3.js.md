---
title: chatpasswordenterprompt3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatpasswordenterprompt3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatpasswordenterprompt3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatpasswordenterprompt3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatpasswordenterprompt3 = /** @type {(inputs: {}) => string} */ () => {
	return `Enter password`
};

const ko_chatpasswordenterprompt3 = /** @type {(inputs: {}) => string} */ () => {
	return `비밀번호를 입력하세요`
};

const ja_chatpasswordenterprompt3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードを入力してください`
};

const zh_chatpasswordenterprompt3 = /** @type {(inputs: {}) => string} */ () => {
	return `请输入密码`
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
const chatpasswordenterprompt3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatpasswordenterprompt3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatpasswordenterprompt3", locale)
	if (locale === "en") return en_chatpasswordenterprompt3(inputs)
	if (locale === "ko") return ko_chatpasswordenterprompt3(inputs)
	if (locale === "ja") return ja_chatpasswordenterprompt3(inputs)
	return zh_chatpasswordenterprompt3(inputs)
};
export { chatpasswordenterprompt3 as "chatPasswordEnterPrompt" }
```
