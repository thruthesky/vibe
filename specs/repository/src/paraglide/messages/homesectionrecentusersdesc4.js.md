---
title: homesectionrecentusersdesc4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesectionrecentusersdesc4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesectionrecentusersdesc4.js

## 개요

**원본 경로**: `src/paraglide/messages/homesectionrecentusersdesc4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesectionrecentusersdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `Newly joined members will appear here soon.`
};

const ko_homesectionrecentusersdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `방금 가입한 사용자 목록이 여기에 표시될 예정입니다.`
};

const ja_homesectionrecentusersdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `新しく参加したユーザーをここで確認できるようにします。`
};

const zh_homesectionrecentusersdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `最新加入的成员将很快在这里显示。`
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
const homesectionrecentusersdesc4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesectionrecentusersdesc4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesectionrecentusersdesc4", locale)
	if (locale === "en") return en_homesectionrecentusersdesc4(inputs)
	if (locale === "ko") return ko_homesectionrecentusersdesc4(inputs)
	if (locale === "ja") return ja_homesectionrecentusersdesc4(inputs)
	return zh_homesectionrecentusersdesc4(inputs)
};
export { homesectionrecentusersdesc4 as "homeSectionRecentUsersDesc" }
```
