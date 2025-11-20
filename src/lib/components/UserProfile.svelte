<!--
  사용자 프로필 표시 컴포넌트 (재사용 가능)

  기능:
  - 사용자 UID를 받아서 프로필 사진(photoUrl)과 이름(displayName)을 표시
  - RTDB에서 최소한의 필드만 읽어서 비용 절감
  - 로딩/에러 상태 처리
  - 글 목록, 댓글 목록 등 어디서든 재사용 가능
-->

<script lang="ts">
	import { getUserBasicInfo } from '$lib/functions/user.functions';
	import * as m from '$lib/paraglide/messages.js';

	/**
	 * Props
	 */
	interface Props {
		/** 사용자 UID */
		uid: string;
		/** 사진 크기 (Tailwind 클래스: h-8 w-8 등) */
		photoSize?: string;
		/** 텍스트 크기 (Tailwind 클래스: text-sm 등) */
		textSize?: string;
	}

	let { uid, photoSize = 'h-8 w-8', textSize = 'text-sm' }: Props = $props();
</script>

<!-- 사용자 프로필 표시 -->
{#await getUserBasicInfo(uid)}
	<!-- 로딩 중: UID만 표시 -->
	<div class="flex items-center gap-2">
		<div
			class="flex items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-white {photoSize}"
		>
			<span>{uid.charAt(0).toUpperCase()}</span>
		</div>
		<span class="font-medium text-gray-700 {textSize}">{uid}</span>
	</div>
{:then userInfo}
	<!-- 사용자 정보 표시 -->
	<div class="flex items-center gap-2">
		{#if userInfo.photoUrl}
			<img
				src={userInfo.photoUrl}
				alt={userInfo.displayName || m.userDefaultName()}
				class="rounded-full object-cover {photoSize}"
			/>
		{:else}
			<div
				class="flex items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-white {photoSize}"
			>
				<span>{(userInfo.displayName || uid).charAt(0).toUpperCase()}</span>
			</div>
		{/if}
		<span class="font-medium text-gray-700 {textSize}">{userInfo.displayName || uid}</span>
	</div>
{:catch error}
	<!-- 에러 발생 시: UID만 표시 -->
	<div class="flex items-center gap-2">
		<div
			class="flex items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-white {photoSize}"
		>
			<span>{uid.charAt(0).toUpperCase()}</span>
		</div>
		<span class="font-medium text-gray-700 {textSize}">{uid}</span>
	</div>
{/await}
