---
title: reportreasonfakenews3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/reportreasonfakenews3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# reportreasonfakenews3.js

## 개요

**원본 경로**: `src/paraglide/messages/reportreasonfakenews3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_reportreasonfakenews3 = /** @type {(inputs: {}) => string} */ () => {
	return `Misinformation`
};

const ko_reportreasonfakenews3 = /** @type {(inputs: {}) => string} */ () => {
	return `허위 정보`
};

const ja_reportreasonfakenews3 = /** @type {(inputs: {}) => string} */ () => {
	return `虚偽情報`
};

const zh_reportreasonfakenews3 = /** @type {(inputs: {}) => string} */ () => {
	return `虚假信息`
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
const reportreasonfakenews3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.reportreasonfakenews3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("reportreasonfakenews3", locale)
	if (locale === "en") return en_reportreasonfakenews3(inputs)
	if (locale === "ko") return ko_reportreasonfakenews3(inputs)
	if (locale === "ja") return ja_reportreasonfakenews3(inputs)
	return zh_reportreasonfakenews3(inputs)
};
export { reportreasonfakenews3 as "reportReasonFakeNews" }
```
