---
title: influencerrankingdescription2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/influencerrankingdescription2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# influencerrankingdescription2.js

## 개요

**원본 경로**: `src/paraglide/messages/influencerrankingdescription2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_influencerrankingdescription2 = /** @type {(inputs: {}) => string} */ () => {
	return `See the most engaged users`
};

const ko_influencerrankingdescription2 = /** @type {(inputs: {}) => string} */ () => {
	return `가장 많은 관심을 받은 사용자들을 확인하세요`
};

const ja_influencerrankingdescription2 = /** @type {(inputs: {}) => string} */ () => {
	return `最も人気のあるユーザーを確認する`
};

const zh_influencerrankingdescription2 = /** @type {(inputs: {}) => string} */ () => {
	return `查看最受欢迎的用户`
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
const influencerrankingdescription2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.influencerrankingdescription2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("influencerrankingdescription2", locale)
	if (locale === "en") return en_influencerrankingdescription2(inputs)
	if (locale === "ko") return ko_influencerrankingdescription2(inputs)
	if (locale === "ja") return ja_influencerrankingdescription2(inputs)
	return zh_influencerrankingdescription2(inputs)
};
export { influencerrankingdescription2 as "influencerRankingDescription" }
```
