---
title: sidebartodochatinvitesdesc4.js - JavaScript 소스 코드
original_path: src/paraglide/messages/sidebartodochatinvitesdesc4.js
category: source
file_type: js
status: current
last_updated: 2025-11-20
---

# sidebartodochatinvitesdesc4.js

## 개요

**원본 경로**: `src/paraglide/messages/sidebartodochatinvitesdesc4.js`

**파일 유형**: JavaScript 소스 코드

## 소스 코드

```javascript
/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';

const en_sidebartodochatinvitesdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `Surface invite banners above the chat list and confirm before entering.`
};

const ko_sidebartodochatinvitesdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `초대 알림을 채팅 목록 상단에 노출하고 입장 여부를 확인할 수 있게 합니다.`
};

const ja_sidebartodochatinvitesdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット一覧の上部に招待を表示し、入室前に参加するか確認します。`
};

const zh_sidebartodochatinvitesdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `在聊天列表顶部显示邀请并在入场前询问是否加入。`
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
const sidebartodochatinvitesdesc4 = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.sidebartodochatinvitesdesc4(inputs) 
	}
	const locale = options.locale ?? getLocale()
	trackMessageCall("sidebartodochatinvitesdesc4", locale)
	if (locale === "en") return en_sidebartodochatinvitesdesc4(inputs)
	if (locale === "ko") return ko_sidebartodochatinvitesdesc4(inputs)
	if (locale === "ja") return ja_sidebartodochatinvitesdesc4(inputs)
	return zh_sidebartodochatinvitesdesc4(inputs)
};
export { sidebartodochatinvitesdesc4 as "sidebarTodoChatInvitesDesc" }
```
