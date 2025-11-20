---
title: chatchattingwith2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/chatchattingwith2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# chatchattingwith2.js

## 개요

**원본 경로**: `src/paraglide/messages/chatchattingwith2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_chatchattingwith2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `You are chatting with ${i.name}.`
};

const ko_chatchattingwith2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.name}님과 채팅 중입니다.`
};

const ja_chatchattingwith2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.name}さんとチャット中です。`
};

const zh_chatchattingwith2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `您正在与${i.name}聊天。`
};

/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. `en.json`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* 
* @param {{ name: NonNullable<unknown> }} inputs
* @param {{ locale?: "en" | "ko" | "ja" | "zh" }} options
* @returns {string}
*/
/* @__NO_SIDE_EFFECTS__ */
const chatchattingwith2 = (inputs, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.chatchattingwith2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("chatchattingwith2", locale)
	if (locale === "en") return en_chatchattingwith2(inputs)
	if (locale === "ko") return ko_chatchattingwith2(inputs)
	if (locale === "ja") return ja_chatchattingwith2(inputs)
	return zh_chatchattingwith2(inputs)
};
export { chatchattingwith2 as "chatChattingWith" }
```
