---
title: +page.svelte
type: component
path: src/routes/my/profile/+page.svelte
status: active
version: 1.0.0
last_updated: 2025-11-15
---

## 개요

이 파일은 `src/routes/my/profile/+page.svelte`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 소스 코드

```svelte
<script lang="ts">
	/**
	 * 내 프로필 수정 페이지
	 *
	 * 로그인한 사용자 자신의 프로필 정보를 수정하는 페이지입니다.
	 * - 프로필 사진 업로드 (photoUrl)
	 * - 닉네임 (displayName)
	 * - 성별 (gender)
	 * - 생년월일 (birthYear, birthMonth, birthDay)
	 */

	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb, storage } from '$lib/firebase';
	import { ref as dbRef, get, update } from 'firebase/database';
	import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Camera, X } from 'lucide-svelte';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { m } from '$lib/paraglide/messages';

	// 폼 데이터 상태
	let displayName = $state('');
	let photoUrl = $state(''); // 프로필 사진 URL
	let gender = $state<'M' | 'F' | ''>('');
	let birthYear = $state<number | null>(null);
	let birthMonth = $state<number | null>(null);
	let birthDay = $state<number | null>(null);

	// UI 상태
	let loading = $state(false);
	let saving = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let photoPreview = $state<string | null>(null); // 사진 미리보기 URL
	let fileInput = $state<HTMLInputElement | null>(null); // 파일 input 참조
	let isPhotoUploading = $state(false); // 사진 업로드 중 상태

	// 년도 옵션 생성 (현재년도-70 ~ 현재년도-18)
	const currentYear = new Date().getFullYear();
	const minYear = currentYear - 70; // 70년 전
	const maxYear = currentYear - 18; // 18년 전 (미성년자 제외)
	const yearOptions = $derived(
		Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)
	);

	// 월 옵션 (1-12)
	const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

	// 일 옵션 (1-31) - 실제로는 월에 따라 달라질 수 있지만 단순화
	const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

	/**
	 * 사용자 프로필 데이터 로드
	 */
	async function loadProfile() {
		if (!authStore.user?.uid || !rtdb) return;

		loading = true;
		errorMessage = '';

		try {
			const userRef = dbRef(rtdb, `users/${authStore.user.uid}`);
			const snapshot = await get(userRef);

			if (snapshot.exists()) {
				const userData = snapshot.val();
				displayName = userData.displayName || '';
				photoUrl = userData.photoUrl || ''; // 프로필 사진 URL 로드
				gender = userData.gender || '';

				// 생년월일 로드 (Cloud Functions가 생성한 파생 필드 사용)
				if (userData.birthYear !== undefined && userData.birthYear !== null) {
					birthYear = userData.birthYear;
				}
				if (userData.birthMonth !== undefined && userData.birthMonth !== null) {
					birthMonth = userData.birthMonth;
				}
				if (userData.birthDay !== undefined && userData.birthDay !== null) {
					birthDay = userData.birthDay;
				}

				// 하위 호환성: birthYearMonthDay 필드가 있으면 파싱 (파생 필드가 없는 경우)
				if (
					(birthYear === null || birthMonth === null || birthDay === null) &&
					userData.birthYearMonthDay
				) {
					const parts = userData.birthYearMonthDay.split('-');
					if (parts.length === 3) {
						birthYear = parseInt(parts[0]);
						birthMonth = parseInt(parts[1]);
						birthDay = parseInt(parts[2]);
					}
				}
			} else {
				// 신규 사용자 - Firebase Auth에서 displayName 가져오기
				displayName = authStore.user.displayName || '';
			}
		} catch (error) {
			console.error('프로필 로드 실패:', error);
			errorMessage = m.profileLoadFailed();
		} finally {
			loading = false;
		}
	}

	/**
	 * 파일 input 클릭 트리거
	 */
	function handlePhotoClick() {
		fileInput?.click();
	}

	/**
	 * 파일 선택 시 처리
	 * - 파일 유효성 검증 (크기, 타입)
	 * - 미리보기 생성
	 * - Firebase Storage에 업로드
	 */
	async function handlePhotoChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// 파일 타입 검증
		if (!file.type.startsWith('image/')) {
			errorMessage = m.profilePictureTypeError();
			return;
		}

		// 파일 크기 검증 (5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			errorMessage = m.profilePictureSizeError();
			return;
		}

		// 미리보기 생성
		const reader = new FileReader();
		reader.onload = (e) => {
			photoPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);

		// Firebase Storage에 업로드
		await uploadPhoto(file);

		// 파일 input 초기화
		if (target) {
			target.value = '';
		}
	}

	/**
	 * Firebase Storage에 사진 업로드
	 * - 파일명: profile_{uid}_{timestamp}.{extension}
	 * - 경로: users/{uid}/profile/{filename}
	 * - 업로드 후 download URL을 photoUrl에 저장
	 */
	async function uploadPhoto(file: File) {
		if (!authStore.user?.uid || !storage) {
			errorMessage = m.authSignInRequired();
			return;
		}

		isPhotoUploading = true;
		errorMessage = '';
		successMessage = '';

		try {
			// 파일 확장자 추출
			const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
			const fileName = `profile_${authStore.user.uid}_${Date.now()}.${extension}`;

			// Storage 참조 생성
			const photoStorageRef = storageRef(storage, `users/${authStore.user.uid}/profile/${fileName}`);

			// 파일 업로드
			const snapshot = await uploadBytes(photoStorageRef, file);

			// Download URL 가져오기
			const downloadURL = await getDownloadURL(snapshot.ref);

			// photoUrl 업데이트
			photoUrl = downloadURL;

			// RTDB에 즉시 저장
			if (rtdb) {
				const userRef = dbRef(rtdb, `users/${authStore.user.uid}`);
				await update(userRef, { photoUrl: downloadURL });
			}

			successMessage = m.profilePictureUploadSuccess();

			// 3초 후 성공 메시지 제거
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (error) {
			console.error('사진 업로드 실패:', error);
			errorMessage = m.profilePictureUploadFailed();
			photoPreview = null;
		} finally {
			isPhotoUploading = false;
		}
	}

	/**
	 * 프로필 사진 제거
	 * - photoUrl과 photoPreview를 null로 설정
	 * - RTDB에서 photoUrl 필드 제거
	 */
	async function handleRemovePhoto() {
		if (!authStore.user?.uid || !rtdb) {
			errorMessage = m.authSignInRequired();
			return;
		}

		isPhotoUploading = true;
		errorMessage = '';
		successMessage = '';

		try {
			// RTDB에서 photoUrl 제거
			const userRef = dbRef(rtdb, `users/${authStore.user.uid}`);
			await update(userRef, { photoUrl: null });

			// 상태 초기화
			photoUrl = '';
			photoPreview = null;

			successMessage = m.profilePictureRemoveSuccess();

			// 3초 후 성공 메시지 제거
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (error) {
			console.error('사진 제거 실패:', error);
			errorMessage = m.profilePictureRemoveFailed();
		} finally {
			isPhotoUploading = false;
		}
	}

	/**
	 * 프로필 저장
	 */
	async function handleSave() {
		if (!authStore.user?.uid || !rtdb) {
			errorMessage = m.authSignInRequired();
			return;
		}

		// 유효성 검증
		if (!displayName.trim()) {
			errorMessage = m.profileNicknameRequired();
			return;
		}

		if (displayName.length > 50) {
			errorMessage = m.profileNicknameLength();
			return;
		}

		saving = true;
		errorMessage = '';
		successMessage = '';

		try {
			const updateData: Record<string, string> = {
				displayName: displayName.trim()
			};

			// gender가 선택된 경우에만 저장
			if (gender) {
				updateData.gender = gender;
			}

			// 생년월일이 모두 선택된 경우에만 저장
			if (birthYear !== null && birthMonth !== null && birthDay !== null) {
				// YYYY-MM-DD 형식으로 변환
				const month = birthMonth.toString().padStart(2, '0');
				const day = birthDay.toString().padStart(2, '0');
				updateData.birthYearMonthDay = `${birthYear}-${month}-${day}`;

				// 미래 날짜 검증
				const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
				if (birthDate > new Date()) {
					errorMessage = m.profileDateOfBirthPastError();
					saving = false;
					return;
				}
			}

			// photoUrl이 있으면 저장
			if (photoUrl) {
				updateData.photoUrl = photoUrl;
			}

			// Firebase RTDB에 저장
			const userRef = dbRef(rtdb, `users/${authStore.user.uid}`);
			await update(userRef, updateData);

			successMessage = m.profileSaveSuccess();

			// 3초 후 성공 메시지 제거
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (error) {
			console.error('프로필 저장 실패:', error);
			errorMessage = m.profileSaveFailed();
		} finally {
			saving = false;
		}
	}

	/**
	 * 컴포넌트 마운트 시 프로필 로드
	 */
	$effect(() => {
		if (authStore.initialized) {
			if (!authStore.isAuthenticated) {
				// 비로그인 사용자는 로그인 페이지로 리다이렉트
				goto('/user/login');
			} else {
				loadProfile();
			}
		}
	});
</script>

<svelte:head>
	<title>{m.pageTitleMyProfile()}</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center py-8">
	<div class="mx-auto w-full max-w-md space-y-6">
		<!-- 페이지 헤더 -->
		<div class="text-center">
			<h1 class="text-2xl font-bold text-gray-900">{m.navMyProfile()}</h1>
			<p class="mt-2 text-sm text-gray-600">{m.profileInfoEditGuide()}</p>
		</div>

		<!-- 로딩 상태 -->
		{#if loading}
			<Card.Root>
				<Card.Content class="pt-6">
					<p class="text-center text-gray-600">{m.profileLoading()}</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- 프로필 수정 폼 -->
			<Card.Root>
				<Card.Header>
					<Card.Title>{m.profileInfo()}</Card.Title>
					<Card.Description>{m.profileInfoGuide()}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- 성공 메시지 -->
					{#if successMessage}
						<Alert.Root>
							<Alert.Title>{m.commonSuccess()}</Alert.Title>
							<Alert.Description>{successMessage}</Alert.Description>
						</Alert.Root>
					{/if}

					<!-- 에러 메시지 -->
					{#if errorMessage}
						<Alert.Root variant="destructive">
							<Alert.Title>{m.commonError()}</Alert.Title>
							<Alert.Description>{errorMessage}</Alert.Description>
						</Alert.Root>
					{/if}

					<!-- 프로필 사진 -->
					<div class="space-y-2">
						<div class="block text-sm font-medium text-gray-700">{m.profilePicture()}</div>
						<div class="flex items-center justify-center">
							<div class="relative">
								<!-- 사진 미리보기 또는 기본 회색 원 -->
								<button
									type="button"
									onclick={handlePhotoClick}
									disabled={isPhotoUploading}
									class="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100 transition-all hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#if authStore.user?.uid}
										<Avatar uid={authStore.user.uid} size={128} class="pointer-events-none" />
									{:else}
										<div class="flex h-full w-full items-center justify-center">
											<span class="text-4xl text-gray-400">👤</span>
										</div>
									{/if}

									{#if photoPreview}
										<img
											src={photoPreview}
											alt={m.profilePicture()}
											class="absolute inset-0 h-full w-full object-cover pointer-events-none"
											aria-live="polite"
										/>
									{/if}
								</button>

								<!-- 카메라 아이콘 배지 (버튼 밖으로 이동) -->
								<div
									class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg"
								>
									{#if isPhotoUploading}
										<!-- 업로드 중 표시 -->
										<svg
											class="h-4 w-4 animate-spin"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									{:else}
										<Camera class="h-4 w-4" />
									{/if}
								</div>

								<!-- 사진 제거 버튼 (사진이 있을 때만 표시) -->
								{#if (photoUrl || photoPreview) && !isPhotoUploading}
									<button
										type="button"
										onclick={handleRemovePhoto}
										class="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white shadow-lg transition-all hover:bg-red-600"
										title={m.profilePictureRemove()}
									>
										<X class="h-4 w-4" />
									</button>
								{/if}

								<!-- 숨겨진 파일 input -->
								<input
									type="file"
									bind:this={fileInput}
									onchange={handlePhotoChange}
									accept="image/*"
									class="hidden"
								/>
							</div>
						</div>
						<p class="text-center text-xs text-gray-500">
							{m.profilePictureUploadGuide()}
						</p>
					</div>

					<!-- 닉네임 -->
					<div class="space-y-2">
						<label for="displayName" class="block text-sm font-medium text-gray-700">
							{m.profileNickname()} <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="displayName"
							bind:value={displayName}
							placeholder={m.profileNicknameInput()}
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							maxlength="50"
						/>
						<p class="text-xs text-gray-500">{m.profileNicknameMaxLength()}</p>
					</div>

					<!-- 성별 -->
					<div class="space-y-2">
						<label for="gender" class="block text-sm font-medium text-gray-700">
							{m.profileGender()}
						</label>
						<select
							id="gender"
							bind:value={gender}
							class="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="">{m.profileGenderNoAnswer()}</option>
							<option value="M">{m.profileGenderMale()}</option>
							<option value="F">{m.profileGenderFemale()}</option>
						</select>
					</div>

					<!-- 생년월일 -->
					<div class="space-y-2">
						<label for="birthYear" class="block text-sm font-medium text-gray-700">
							{m.profileDateOfBirth()}
						</label>
						<div class="grid grid-cols-3 gap-2">
							<!-- 연도 -->
							<div>
								<select
									id="birthYear"
									bind:value={birthYear}
									class="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									<option value={null}>{m.profileYear()}</option>
									{#each yearOptions as year}
										<option value={year}>{m.profileYearValue({ year })}</option>
									{/each}
								</select>
							</div>

							<!-- 월 -->
							<div>
								<select
									bind:value={birthMonth}
									class="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									<option value={null}>{m.profileMonth()}</option>
									{#each monthOptions as month}
										<option value={month}>{m.profileMonthValue({ month })}</option>
									{/each}
								</select>
							</div>

							<!-- 일 -->
							<div>
								<select
									bind:value={birthDay}
									class="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									<option value={null}>{m.profileDay()}</option>
									{#each dayOptions as day}
										<option value={day}>{m.profileDayValue({ day })}</option>
									{/each}
								</select>
							</div>
						</div>
						<p class="text-xs text-gray-500">
							{m.profileAgeRestriction({ minYear, maxYear })}
						</p>
					</div>

					<!-- 저장 버튼 -->
					<div class="pt-6">
						<Button
							class="w-full cursor-pointer bg-blue-600 py-6 text-lg font-semibold text-white hover:bg-blue-700"
							onclick={handleSave}
							disabled={saving}
						>
							{saving ? m.profileSaving() : m.profileSave()}
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>

```

