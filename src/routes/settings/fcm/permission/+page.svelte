<script lang="ts">
	/**
	 * FCM 푸시 알림 권한 설정 안내 페이지
	 *
	 * 브라우저에서 푸시 알림 권한이 차단된 경우,
	 * 브라우저별로 권한을 다시 허용하는 방법을 안내합니다.
	 *
	 * 이 페이지에 접속하면 SessionStorage에 플래그를 저장하여
	 * 해당 세션 동안 권한 요청 팝업을 더 이상 표시하지 않습니다.
	 */

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import * as m from '$lib/paraglide/messages.js';

	const DISMISSED_KEY = 'fcmPermissionDismissed';

	/**
	 * 페이지 마운트 시 SessionStorage에 플래그 저장
	 */
	onMount(() => {
		if (browser) {
			sessionStorage.setItem(DISMISSED_KEY, 'true');
		}
	});
</script>

<div class="container">
	<h1 class="page-title">{m.fcmPermissionGuideTitle()}</h1>

	<Card class="mb-6">
		<CardHeader>
			<CardTitle>{m.fcmPermissionBlockedTitle()}</CardTitle>
			<CardDescription>
				{m.fcmPermissionBlockedDesc()}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="notice">
				{m.fcmPermissionNotice()}
			</p>
		</CardContent>
	</Card>

	<!-- Chrome 데스크탑 -->
	<Card class="mb-6">
		<CardHeader>
			<CardTitle>{m.chromeDesktopInstructions()}</CardTitle>
		</CardHeader>
		<CardContent>
			<ol class="instruction-list">
				<li>주소창 왼쪽의 <strong>{m.lockIconLabel()}</strong> 또는 <strong>{m.infoIconLabel()}</strong>을 클릭합니다.</li>
				<li><strong>"{m.notificationsLabel()}"</strong> 항목을 찾습니다.</li>
				<li>설정을 <strong>"{m.allowOption()}"</strong>으로 변경합니다.</li>
				<li>{m.refreshPageInstructions()}</li>
			</ol>
		</CardContent>
	</Card>

	<!-- Chrome Android -->
	<Card class="mb-6">
		<CardHeader>
			<CardTitle>{m.chromeAndroidInstructions()}</CardTitle>
		</CardHeader>
		<CardContent>
			<ol class="instruction-list">
				<li>{m.browserMenuAndroid()}</li>
				<li><strong>"{m.siteSettingsLabel()}"</strong>을 선택합니다.</li>
				<li><strong>"{m.notificationsLabel()}"</strong>을 선택합니다.</li>
				<li>{m.allowBlockedSiteAndroid()}</li>
				<li>{m.refreshPageInstructions()}</li>
			</ol>
		</CardContent>
	</Card>

	<!-- Safari macOS -->
	<Card class="mb-6">
		<CardHeader>
			<CardTitle>{m.safariMacInstructions()}</CardTitle>
		</CardHeader>
		<CardContent>
			<ol class="instruction-list">
				<li><strong>{m.safariPreferences()}</strong>을 엽니다.</li>
				<li><strong>"{m.websitesLabel()}"</strong> 탭을 선택합니다.</li>
				<li>왼쪽 목록에서 <strong>"{m.notificationsLabel()}"</strong>을 선택합니다.</li>
				<li>오른쪽 목록에서 현재 사이트를 찾아 <strong>"{m.allowOption()}"</strong>으로 변경합니다.</li>
				<li>{m.refreshPageInstructions()}</li>
			</ol>
			<p class="note">
				<strong>참고:</strong> {m.safariIosNotice()}
			</p>
		</CardContent>
	</Card>

	<!-- Firefox 데스크탑 -->
	<Card class="mb-6">
		<CardHeader>
			<CardTitle>{m.firefoxDesktopInstructions()}</CardTitle>
		</CardHeader>
		<CardContent>
			<ol class="instruction-list">
				<li>주소창 왼쪽의 <strong>{m.lockIconLabel()}</strong>을 클릭합니다.</li>
				<li><strong>"{m.safeConnectionLabel()}"</strong> 옆의 화살표를 클릭합니다.</li>
				<li><strong>"{m.moreInfoLabel()}"</strong>를 선택합니다.</li>
				<li><strong>"{m.permissionsLabel()}"</strong> 탭을 선택합니다.</li>
				<li><strong>"{m.sendNotificationsLabel()}"</strong> 항목에서 <strong>"{m.allowOption()}"</strong>을 선택합니다.</li>
				<li>{m.refreshPageInstructions()}</li>
			</ol>
		</CardContent>
	</Card>

	<!-- Edge -->
	<Card class="mb-6">
		<CardHeader>
			<CardTitle>{m.edgeDesktopInstructions()}</CardTitle>
		</CardHeader>
		<CardContent>
			<ol class="instruction-list">
				<li>주소창 왼쪽의 <strong>{m.lockIconLabel()}</strong>을 클릭합니다.</li>
				<li><strong>"{m.sitePermissionsLabel()}"</strong>을 선택합니다.</li>
				<li><strong>"{m.notificationsLabel()}"</strong> 항목을 <strong>"{m.allowOption()}"</strong>으로 변경합니다.</li>
				<li>{m.refreshPageInstructions()}</li>
			</ol>
		</CardContent>
	</Card>

	<!-- 추가 안내 -->
	<Card class="mb-6">
		<CardHeader>
			<CardTitle>{m.verificationMethodTitle()}</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="notice">
				{m.permissionReenabledNotice1()}
			</p>
			<p class="notice">
				{m.permissionReenabledNotice2()}
			</p>
		</CardContent>
	</Card>

	<!-- 문의 안내 -->
	<Card>
		<CardHeader>
			<CardTitle>{m.additionalInquiries()}</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="notice">
				{m.contactSupportNotice()}
			</p>
		</CardContent>
	</Card>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 컨테이너 */
	.container {
		@apply mx-auto max-w-4xl p-4;
	}

	/* 페이지 제목 */
	.page-title {
		@apply text-3xl font-bold mb-6 text-gray-900;
	}

	/* 안내 문구 */
	.notice {
		@apply text-sm text-gray-700 mb-2;
	}

	/* 참고 문구 */
	.note {
		@apply text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded border border-gray-200;
	}

	/* 순서 목록 */
	.instruction-list {
		@apply list-decimal list-inside text-sm text-gray-700 space-y-2;
	}

	/* 목록 항목 */
	.instruction-list li {
		@apply leading-relaxed;
	}
</style>
