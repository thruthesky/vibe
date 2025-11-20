---
title: chatsignintosend4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatsignintosend4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatsignintosend4.js

## 개요

**원본 경로**: `src/paraglide/messages/chatsignintosend4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatsignintosend4 = /** @type {(inputs: {}) => string} */ () => {
	return `Please sign in to send messages.`
};

const ko_chatsignintosend4 = /** @type {(inputs: {}) => string} */ () => {
	return `메시지를 전송하려면 로그인하세요.`
};

const ja_chatsignintosend4 = /** @type {(inputs: {}) => string} */ () => {
	return `メッセージを送信するにはログインしてください。`
};

const zh_chatsignintosend4 = /** @type {(inputs: {}) => string} */ () => {
	return `请登录以发送消息。`
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
const chatsignintosend4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatsignintosend4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatsignintosend4", locale)
	if (locale === "en") return en_chatsignintosend4(inputs)
	if (locale === "ko") return ko_chatsignintosend4(inputs)
	if (locale === "ja") return ja_chatsignintosend4(inputs)
	return zh_chatsignintosend4(inputs)
};
export { chatsignintosend4 as "chatSignInToSend" }
```
