---
title: sidebardevhighlightattachment3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/sidebardevhighlightattachment3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# sidebardevhighlightattachment3.js

## 개요

**원본 경로**: `src/paraglide/messages/sidebardevhighlightattachment3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_sidebardevhighlightattachment3 = /** @type {(inputs: {}) => string} */ () => {
	return `9. File attachments`
};

const ko_sidebardevhighlightattachment3 = /** @type {(inputs: {}) => string} */ () => {
	return `9. 첨부파일 업로드`
};

const ja_sidebardevhighlightattachment3 = /** @type {(inputs: {}) => string} */ () => {
	return `9. 添付ファイルアップロード`
};

const zh_sidebardevhighlightattachment3 = /** @type {(inputs: {}) => string} */ () => {
	return `9. 文件附件上传`
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
const sidebardevhighlightattachment3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.sidebardevhighlightattachment3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("sidebardevhighlightattachment3", locale)
	if (locale === "en") return en_sidebardevhighlightattachment3(inputs)
	if (locale === "ko") return ko_sidebardevhighlightattachment3(inputs)
	if (locale === "ja") return ja_sidebardevhighlightattachment3(inputs)
	return zh_sidebardevhighlightattachment3(inputs)
};
export { sidebardevhighlightattachment3 as "sidebarDevHighlightAttachment" }
```
