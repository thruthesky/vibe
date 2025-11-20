---
title: homesectionpopularopenroomdesc5.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesectionpopularopenroomdesc5.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesectionpopularopenroomdesc5.js

## 개요

**원본 경로**: `src/paraglide/messages/homesectionpopularopenroomdesc5.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_homesectionpopularopenroomdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `We will highlight the most active open rooms for quick access.`
};

const ko_homesectionpopularopenroomdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `참여자가 많은 오픈 채팅방을 추천해 드립니다.`
};

const ja_homesectionpopularopenroomdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `参加者が多いルームをおすすめとして表示します。`
};

const zh_homesectionpopularopenroomdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `我们会推荐参与度最高的开放聊天室。`
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
const homesectionpopularopenroomdesc5 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesectionpopularopenroomdesc5(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesectionpopularopenroomdesc5", locale)
	if (locale === "en") return en_homesectionpopularopenroomdesc5(inputs)
	if (locale === "ko") return ko_homesectionpopularopenroomdesc5(inputs)
	if (locale === "ja") return ja_homesectionpopularopenroomdesc5(inputs)
	return zh_homesectionpopularopenroomdesc5(inputs)
};
export { homesectionpopularopenroomdesc5 as "homeSectionPopularOpenRoomDesc" }
```
