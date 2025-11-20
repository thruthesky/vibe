---
title: homesectionrecentopenchatlogin5.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesectionrecentopenchatlogin5.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesectionrecentopenchatlogin5.js

## 개요

**원본 경로**: `src/paraglide/messages/homesectionrecentopenchatlogin5.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesectionrecentopenchatlogin5 = /** @type {(inputs: {}) => string} */ () => {
	return `Sign in to see the latest messages from the open chats you joined.`
};

const ko_homesectionrecentopenchatlogin5 = /** @type {(inputs: {}) => string} */ () => {
	return `로그인하면 참여 중인 오픈 채팅의 최신 메시지를 볼 수 있습니다.`
};

const ja_homesectionrecentopenchatlogin5 = /** @type {(inputs: {}) => string} */ () => {
	return `ログインすると参加中のオープンチャットの最新メッセージを確認できます。`
};

const zh_homesectionrecentopenchatlogin5 = /** @type {(inputs: {}) => string} */ () => {
	return `登录后即可查看你参与的开放聊天室最新消息。`
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
const homesectionrecentopenchatlogin5 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesectionrecentopenchatlogin5(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesectionrecentopenchatlogin5", locale)
	if (locale === "en") return en_homesectionrecentopenchatlogin5(inputs)
	if (locale === "ko") return ko_homesectionrecentopenchatlogin5(inputs)
	if (locale === "ja") return ja_homesectionrecentopenchatlogin5(inputs)
	return zh_homesectionrecentopenchatlogin5(inputs)
};
export { homesectionrecentopenchatlogin5 as "homeSectionRecentOpenChatLogin" }
```
