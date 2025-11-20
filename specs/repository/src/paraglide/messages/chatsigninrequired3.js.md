---
title: chatsigninrequired3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatsigninrequired3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatsigninrequired3.js

## 개요

**원본 경로**: `src/paraglide/messages/chatsigninrequired3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatsigninrequired3 = /** @type {(inputs: {}) => string} */ () => {
	return `Please sign in to start chatting.`
};

const ko_chatsigninrequired3 = /** @type {(inputs: {}) => string} */ () => {
	return `채팅을 시작하려면 로그인하세요.`
};

const ja_chatsigninrequired3 = /** @type {(inputs: {}) => string} */ () => {
	return `チャットを開始するにはログインしてください。`
};

const zh_chatsigninrequired3 = /** @type {(inputs: {}) => string} */ () => {
	return `请登录以开始聊天。`
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
const chatsigninrequired3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatsigninrequired3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatsigninrequired3", locale)
	if (locale === "en") return en_chatsigninrequired3(inputs)
	if (locale === "ko") return ko_chatsigninrequired3(inputs)
	if (locale === "ja") return ja_chatsigninrequired3(inputs)
	return zh_chatsigninrequired3(inputs)
};
export { chatsigninrequired3 as "chatSignInRequired" }
```
