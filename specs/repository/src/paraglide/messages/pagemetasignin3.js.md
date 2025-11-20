---
title: pagemetasignin3.js - JavaScript 소스 코드
original_path: src/paraglide/messages/pagemetasignin3.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# pagemetasignin3.js

## 개요

**원본 경로**: `src/paraglide/messages/pagemetasignin3.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const zh_pagemetasignin3 = /** @type {(inputs: {}) => string} */ () => {
	return `登录到 Sonub`
};

/** @type {(inputs: {}) => string} */
const en_pagemetasignin3 = () => 'pageMetaSignIn'

/** @type {(inputs: {}) => string} */
const ko_pagemetasignin3 = en_pagemetasignin3;

/** @type {(inputs: {}) => string} */
const ja_pagemetasignin3 = en_pagemetasignin3;

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
const pagemetasignin3 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.pagemetasignin3(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("pagemetasignin3", locale)
	if (locale === "en") return en_pagemetasignin3(inputs)
	if (locale === "ko") return ko_pagemetasignin3(inputs)
	if (locale === "ja") return ja_pagemetasignin3(inputs)
	return zh_pagemetasignin3(inputs)
};
export { pagemetasignin3 as "pageMetaSignIn" }
```
