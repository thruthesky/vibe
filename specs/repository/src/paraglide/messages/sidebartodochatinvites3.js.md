---
title: sidebartodochatinvites3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/sidebartodochatinvites3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# sidebartodochatinvites3.js

## 개요

**원본 경로**: `src/paraglide/messages/sidebartodochatinvites3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_sidebartodochatinvites3 = /** @type {(inputs: {}) => string} */ () => {
	return `Chat invite accept/decline`
};

const ko_sidebartodochatinvites3 = /** @type {(inputs: {}) => string} */ () => {
	return `채팅 초대 수락/거절`
};

const ja_sidebartodochatinvites3 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット招待の承認/拒否`
};

const zh_sidebartodochatinvites3 = /** @type {(inputs: {}) => string} */ () => {
	return `聊天邀请处理`
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
const sidebartodochatinvites3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.sidebartodochatinvites3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("sidebartodochatinvites3", locale)
	if (locale === "en") return en_sidebartodochatinvites3(inputs)
	if (locale === "ko") return ko_sidebartodochatinvites3(inputs)
	if (locale === "ja") return ja_sidebartodochatinvites3(inputs)
	return zh_sidebartodochatinvites3(inputs)
};
export { sidebartodochatinvites3 as "sidebarTodoChatInvites" }
```
