---
title: composepromptplaceholder2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/composepromptplaceholder2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# composepromptplaceholder2.js

## 개요

**원본 경로**: `src/paraglide/messages/composepromptplaceholder2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_composepromptplaceholder2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `What's on your mind, ${i.name}?`
};

const ko_composepromptplaceholder2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.name}님, 근황을 올려주세요`
};

const ja_composepromptplaceholder2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.name}さん、何を考えていますか？`
};

const zh_composepromptplaceholder2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.name}，你在想什么？`
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
const composepromptplaceholder2 = (inputs, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.composepromptplaceholder2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("composepromptplaceholder2", locale)
	if (locale === "en") return en_composepromptplaceholder2(inputs)
	if (locale === "ko") return ko_composepromptplaceholder2(inputs)
	if (locale === "ja") return ja_composepromptplaceholder2(inputs)
	return zh_composepromptplaceholder2(inputs)
};
export { composepromptplaceholder2 as "composePromptPlaceholder" }
```
