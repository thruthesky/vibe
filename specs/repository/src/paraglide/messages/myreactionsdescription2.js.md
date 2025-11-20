---
title: myreactionsdescription2.js - JavaScript 소스 코드
original_path: src/paraglide/messages/myreactionsdescription2.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# myreactionsdescription2.js

## 개요

**원본 경로**: `src/paraglide/messages/myreactionsdescription2.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_myreactionsdescription2 = /** @type {(inputs: {}) => string} */ () => {
	return `Keep track of likes and replies on your posts and comments.`
};

const ko_myreactionsdescription2 = /** @type {(inputs: {}) => string} */ () => {
	return `내 글과 댓글에 달린 좋아요와 댓글을 한눈에 확인하세요.`
};

const ja_myreactionsdescription2 = /** @type {(inputs: {}) => string} */ () => {
	return `自分の投稿やコメントへのいいねと返信を確認できます。`
};

const zh_myreactionsdescription2 = /** @type {(inputs: {}) => string} */ () => {
	return `追踪贴文与留言收到的点赞与回复。`
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
const myreactionsdescription2 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.myreactionsdescription2(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("myreactionsdescription2", locale)
	if (locale === "en") return en_myreactionsdescription2(inputs)
	if (locale === "ko") return ko_myreactionsdescription2(inputs)
	if (locale === "ja") return ja_myreactionsdescription2(inputs)
	return zh_myreactionsdescription2(inputs)
};
export { myreactionsdescription2 as "myReactionsDescription" }
```
