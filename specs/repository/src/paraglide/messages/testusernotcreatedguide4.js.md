---
title: testusernotcreatedguide4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/testusernotcreatedguide4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# testusernotcreatedguide4.js

## 개요

**원본 경로**: `src/paraglide/messages/testusernotcreatedguide4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_testusernotcreatedguide4 = /** @type {(inputs: {}) => string} */ () => {
	return `No test users have been created. Use the <strong><a class="text-blue-600" href="/admin/test/create-test-data">Create Test Data</a></strong> page to generate 100 test accounts.`
};

const ko_testusernotcreatedguide4 = /** @type {(inputs: {}) => string} */ () => {
	return `생성된 테스트 사용자가 없습니다. <strong><a class="text-blue-600" href="/admin/test/create-test-data">테스트 데이터 생성</a></strong> 페이지에서 테스트 사용자 100명을 만들 수 있습니다.`
};

const ja_testusernotcreatedguide4 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザーはまだありません。<strong><a class="text-blue-600" href="/admin/test/create-test-data">テストデータ作成</a></strong>ページで100人のテストユーザーを作成してください。`
};

const zh_testusernotcreatedguide4 = /** @type {(inputs: {}) => string} */ () => {
	return `尚未创建测试用户。请前往 <strong><a class="text-blue-600" href="/admin/test/create-test-data">测试数据创建</a></strong> 页面生成 100 个测试账户。`
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
const testusernotcreatedguide4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.testusernotcreatedguide4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("testusernotcreatedguide4", locale)
	if (locale === "en") return en_testusernotcreatedguide4(inputs)
	if (locale === "ko") return ko_testusernotcreatedguide4(inputs)
	if (locale === "ja") return ja_testusernotcreatedguide4(inputs)
	return zh_testusernotcreatedguide4(inputs)
};
export { testusernotcreatedguide4 as "testUserNotCreatedGuide" }
```
