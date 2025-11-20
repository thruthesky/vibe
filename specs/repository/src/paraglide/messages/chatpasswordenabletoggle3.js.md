---
title: chatpasswordenabletoggle3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatpasswordenabletoggle3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatpasswordenabletoggle3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatpasswordenabletoggle3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatpasswordenabletoggle3 = /** @type {(inputs: {}) => string} */ () => {
	return `Enable Password`
};

const ko_chatpasswordenabletoggle3 = /** @type {(inputs: {}) => string} */ () => {
	return `비밀번호 활성화`
};

const ja_chatpasswordenabletoggle3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードを有効にする`
};

const zh_chatpasswordenabletoggle3 = /** @type {(inputs: {}) => string} */ () => {
	return `启用密码`
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
const chatpasswordenabletoggle3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatpasswordenabletoggle3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatpasswordenabletoggle3", locale)
	if (locale === "en") return en_chatpasswordenabletoggle3(inputs)
	if (locale === "ko") return ko_chatpasswordenabletoggle3(inputs)
	if (locale === "ja") return ja_chatpasswordenabletoggle3(inputs)
	return zh_chatpasswordenabletoggle3(inputs)
};
export { chatpasswordenabletoggle3 as "chatPasswordEnableToggle" }
```
