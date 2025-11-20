---
title: homesidebarmemberscount3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/homesidebarmemberscount3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# homesidebarmemberscount3.js

## 개요

**원본 경로**: `src/paraglide/messages/homesidebarmemberscount3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const ko_homesidebarmemberscount3 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.count}명 참여`
};

const zh_homesidebarmemberscount3 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.count} 人参与`
};

/** @type {(inputs: { count: NonNullable<unknown> }) => string} */
const en_homesidebarmemberscount3 = () => 'homeSidebarMembersCount'

/** @type {(inputs: { count: NonNullable<unknown> }) => string} */
const ja_homesidebarmemberscount3 = en_homesidebarmemberscount3;

/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. `en.json`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* 
* @param {{ count: NonNullable<unknown> }} inputs
* @param {{ locale?: "en" | "ko" | "ja" | "zh" }} options
* @returns {string}
*/
/* @__NO_SIDE_EFFECTS__ */
const homesidebarmemberscount3 = (inputs, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.homesidebarmemberscount3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("homesidebarmemberscount3", locale)
	if (locale === "en") return en_homesidebarmemberscount3(inputs)
	if (locale === "ko") return ko_homesidebarmemberscount3(inputs)
	if (locale === "ja") return ja_homesidebarmemberscount3(inputs)
	return zh_homesidebarmemberscount3(inputs)
};
export { homesidebarmemberscount3 as "homeSidebarMembersCount" }
```
