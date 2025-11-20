---
title: +page.svelte - Svelte 5 컴포넌트
original_path: src/routes/dev/create-posts/+page.svelte
category: route
file_type: svelte
status: current
last_updated: 2025-11-20
---

# +page.svelte

## 개요

**원본 경로**: `src/routes/dev/create-posts/+page.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
<script lang="ts">
	/**
	 * 테스트용 게시글 대량 생성 페이지
	 *
	 * 목적: 개발 및 테스트를 위한 임시 게시글을 대량으로 생성합니다.
	 * 기능:
	 * - 카테고리 선택 (드롭다운)
	 * - 생성할 게시글 개수 선택 (10~100개 단위)
	 * - 진행률 표시
	 */

	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Alert } from '$lib/components/ui/alert';
	import { rtdb } from '$lib/firebase';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ref, push, set } from 'firebase/database';
	import { m } from '$lib/paraglide/messages';

	// 사용 가능한 카테고리 목록 (Firebase Database Rules에 정의된 카테고리)
	const categories = [
		'discussion',
		'qna',
		'news',
		'info',
		'selling',
		'hiring',
		'travel',
		'mukbang',
		'realestate',
		'hobby',
		'story'
	] as const;

	// 카테고리 한글 이름 매핑
	const categoryLabels: Record<string, string> = {
		discussion: '토론',
		qna: '질문과 답변',
		news: '뉴스',
		info: '정보',
		selling: '판매',
		hiring: '구인/구직',
		travel: '여행',
		mukbang: '먹방',
		realestate: '부동산',
		hobby: '취미',
		story: '이야기'
	};

	// 생성 가능한 게시글 개수 옵션
	const countOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

	// 상태 변수들 ($state는 Svelte 5 반응형)
	let selectedCategory = $state<string>('discussion');
	let selectedCount = $state<number>(10);
	let isGenerating = $state(false);
	let progress = $state(0);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let recentKeys = $state<string[]>([]);

	/**
	 * 1초 대기 헬퍼 함수
	 */
	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * 게시글 생성 핸들러
	 */
	async function handleGeneratePosts(): Promise<void> {
		// Firebase 초기화 확인
		if (!rtdb) {
			errorMessage = 'Firebase Realtime Database가 초기화되지 않았습니다.';
			return;
		}

		// 로그인 확인
		if (!authStore.user) {
			errorMessage = '로그인이 필요합니다.';
			return;
		}

		isGenerating = true;
		progress = 0;
		errorMessage = null;
		successMessage = null;
		recentKeys = [];

		try {
			const postsRef = ref(rtdb, 'posts');
			const uid = authStore.user.uid;

			for (let i = 0; i < selectedCount; i += 1) {
				const timestamp = Date.now(); // 각 게시글에 현재 타임스탬프 사용
				const postNumber = i + 1; // 게시글 번호 (1부터 시작)
				const postData = {
					authorUid: uid, // 작성자 UID (Firebase Rules 필수 필드)
					category: selectedCategory, // 선택한 카테고리
					title: `테스트 게시글 #${timestamp}`, // 제목
					text: `${categoryLabels[selectedCategory]} #${postNumber} - 이것은 테스트 게시글입니다. (생성 시각: ${new Date(timestamp).toLocaleString('ko-KR')})`, // 내용
					createdAt: timestamp, // 생성 시각
					updatedAt: timestamp // 수정 시각
				};

				// Firebase에 게시글 저장
				const newPostRef = push(postsRef);
				await set(newPostRef, postData);

				// 진행률 업데이트
				progress = i + 1;

				// 최근 생성된 키 저장 (최대 5개)
				if (newPostRef.key) {
					recentKeys = [newPostRef.key, ...recentKeys].slice(0, 5);
				}

				// 다음 게시글 생성 전에 1초 대기 (마지막 게시글 제외)
				if (i < selectedCount - 1) {
					await sleep(1000);
				}
			}

			successMessage = `총 ${selectedCount}개의 게시글이 성공적으로 생성되었습니다!`;
		} catch (error) {
			console.error('게시글 생성 실패:', error);
			errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
		} finally {
			isGenerating = false;
		}
	}

	// 진행률 퍼센트 계산
	const progressPercentage = $derived(
		selectedCount > 0 ? Math.round((progress / selectedCount) * 100) : 0
	);
</script>

<svelte:head>
	<title>테스트 게시글 생성 - Sonub Dev</title>
</svelte:head>

<div class="space-y-6">
	<!-- 페이지 헤더 -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900">테스트 게시글 생성</h1>
		<p class="mt-2 text-gray-600">
			개발 및 테스트를 위한 임시 게시글을 대량으로 생성합니다. (경로: /posts)
		</p>
	</div>

	<!-- 로그인 상태 경고 -->
	{#if !authStore.user}
		<Alert>
			<div class="text-sm text-red-600">
				<strong>경고:</strong> 게시글을 생성하려면 먼저 로그인이 필요합니다.
			</div>
		</Alert>
	{/if}

	<!-- 게시글 생성 설정 카드 -->
	<Card>
		<div class="space-y-6 p-6">
			<div>
				<h2 class="text-xl font-semibold text-gray-900">생성 설정</h2>
				<p class="text-sm text-gray-600">카테고리와 생성할 게시글 개수를 선택하세요.</p>
			</div>

			<div class="grid gap-6 md:grid-cols-2">
				<!-- 카테고리 선택 -->
				<div>
					<label for="category" class="block text-sm font-medium text-gray-700">
						카테고리 선택
					</label>
					<select
						id="category"
						bind:value={selectedCategory}
						class="mt-2 w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					>
						{#each categories as category}
							<option value={category}>
								{categoryLabels[category]} ({category})
							</option>
						{/each}
					</select>
					<p class="mt-2 text-sm text-gray-500">
						선택한 카테고리: <span class="font-semibold">{categoryLabels[selectedCategory]}</span>
					</p>
				</div>

				<!-- 개수 선택 -->
				<div>
					<label for="count" class="block text-sm font-medium text-gray-700">
						생성할 게시글 개수
					</label>
					<select
						id="count"
						bind:value={selectedCount}
						class="mt-2 w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					>
						{#each countOptions as count}
							<option value={count}>
								{count}개
							</option>
						{/each}
					</select>
					<p class="mt-2 text-sm text-gray-500">
						생성 예정: <span class="font-semibold">{selectedCount}개</span>
					</p>
				</div>
			</div>

			<!-- 생성 버튼 -->
			<div class="flex flex-col gap-4">
				<Button
					onclick={handleGeneratePosts}
					disabled={isGenerating || !authStore.user}
					size="lg"
					class="w-full bg-blue-600 text-white hover:bg-blue-700 md:w-auto"
				>
					{#if isGenerating}
						게시글 생성 중... ({progress}/{selectedCount})
					{:else}
						게시글 생성 시작
					{/if}
				</Button>
			</div>

			<!-- 진행률 표시 -->
			{#if isGenerating || progress > 0}
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-gray-700">진행 상황</span>
						<span class="font-semibold text-gray-900">
							{progress} / {selectedCount} ({progressPercentage}%)
						</span>
					</div>
					<div class="h-3 w-full overflow-hidden rounded-full bg-gray-200">
						<div
							class="h-full bg-blue-500 transition-all duration-300"
							style="width: {progressPercentage}%"
						></div>
					</div>
				</div>
			{/if}

			<!-- 성공 메시지 -->
			{#if successMessage}
				<div class="rounded-lg bg-green-50 p-4 text-sm text-green-800">
					<strong>성공:</strong>
					{successMessage}
				</div>
			{/if}

			<!-- 에러 메시지 -->
			{#if errorMessage}
				<div class="rounded-lg bg-red-50 p-4 text-sm text-red-800">
					<strong>오류:</strong>
					{errorMessage}
				</div>
			{/if}

			<!-- 최근 생성된 키 -->
			{#if recentKeys.length > 0}
				<div>
					<h3 class="text-lg font-semibold text-gray-900">최근 생성된 게시글 ID (최대 5개)</h3>
					<ul class="mt-3 space-y-2 text-sm text-gray-700">
						{#each recentKeys as key}
							<li
								class="rounded border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-900"
							>
								{key}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</Card>

	<!-- 안내 사항 -->
	<Card>
		<div class="space-y-4 p-6 text-sm text-gray-600">
			<h2 class="text-xl font-semibold text-gray-900">생성 정보</h2>
			<ul class="list-inside list-disc space-y-2">
				<li><strong>저장 경로:</strong> /posts/postId</li>
				<li><strong>필수 필드:</strong> authorUid, category, text, createdAt (Firebase Rules 기준)</li>
				<li>
					<strong>사용 가능한 카테고리:</strong>
					{categories.map((c) => categoryLabels[c]).join(', ')}
				</li>
				<li><strong>작성자:</strong> 현재 로그인한 사용자의 UID가 자동으로 설정됩니다.</li>
				<li><strong>확인:</strong> Firebase Console의 Database - posts 경로에서 생성된 게시글을 확인할 수 있습니다.</li>
			</ul>
		</div>
	</Card>

	<!-- 주의 사항 -->
	<Alert>
		<div class="space-y-2 text-sm text-yellow-800">
			<p><strong>주의사항:</strong></p>
			<ul class="list-inside list-disc space-y-1">
				<li>이 기능은 개발 및 테스트 목적으로만 사용하세요.</li>
				<li>생성된 게시글은 실제 데이터베이스에 저장됩니다.</li>
				<li>프로덕션 환경에서는 사용하지 마세요.</li>
			</ul>
		</div>
	</Alert>
</div>

<style>
	/* Tailwind CSS를 사용하므로 추가 스타일 최소화 */
</style>
```
