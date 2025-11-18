---
title: user-profile.svelte.ts
type: typescript
path: src/lib/stores/user-profile.svelte.ts
status: active
version: 1.0.0
last_updated: 2025-11-15
---

## 개요

이 파일은 `src/lib/stores/user-profile.svelte.ts`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 소스 코드

```typescript
/**
 * 사용자 프로필 전용 스토어
 *
 * Firebase Realtime Database의 /users/{uid} 노드를 실시간으로 구독하여
 * 사용자 프로필 데이터를 중앙에서 관리합니다.
 *
 * 주요 기능:
 * - 사용자 프로필 캐시 (중복 RTDB 리스너 제거)
 * - 실시간 프로필 동기화
 * - 여러 컴포넌트에서 동일한 프로필 데이터 공유
 *
 * 사용법:
 * ```typescript
 * import { userProfileStore } from '$lib/stores/user-profile.svelte';
 *
 * // 프로필 구독
 * const profile = userProfileStore.getProfile('user123');
 *
 * // Svelte 컴포넌트에서 사용
 * {#if profile}
 *   <p>{profile.displayName}</p>
 *   <img src={profile.photoUrl} alt="프로필" />
 * {/if}
 * ```
 */

import { rtdb } from '$lib/firebase';
import { ref, onValue, off, type Unsubscribe } from 'firebase/database';

/**
 * 사용자 프로필 데이터 타입
 * RTDB의 /users/{uid} 노드 구조
 */
export interface UserProfile {
	/** 사용자 닉네임 (필수) */
	displayName: string | null;
	/** 프로필 사진 URL (선택) */
	photoUrl: string | null;
	/** 성별 (M: 남성, F: 여성, 선택) */
	gender?: 'M' | 'F' | null;
	/** 생년 (선택) */
	birthYear?: number | null;
	/** 생월 (선택) */
	birthMonth?: number | null;
	/** 생일 (선택) */
	birthDay?: number | null;
	/** 자기소개 (선택) */
	bio?: string | null;
	/** 계정 생성 시간 (Unix timestamp, 밀리초) */
	createdAt?: number | null;
	/** 프로필 수정 시간 (Unix timestamp, 밀리초) */
	updatedAt?: number | null;
}

/**
 * 프로필 캐시 항목
 */
interface ProfileCacheItem {
	/** 프로필 데이터 */
	data: UserProfile | null;
	/** 로딩 중 여부 */
	loading: boolean;
	/** 에러 발생 시 에러 객체 */
	error: Error | null;
	/** RTDB 리스너 구독 해제 함수 */
	unsubscribe: Unsubscribe | null;
}

/**
 * 사용자 프로필 스토어 클래스
 *
 * Svelte 5 runes를 사용하여 프로필 데이터를 중앙에서 관리합니다.
 * 동일한 uid에 대해 중복 RTDB 리스너를 방지합니다.
 */
class UserProfileStore {
	/**
	 * uid별 프로필 캐시
	 * Map<uid, ProfileCacheItem>
	 */
	private cache = $state<Map<string, ProfileCacheItem>>(new Map());

	/**
	 * 프로필 구독 시작 (상태 변경 가능)
	 *
	 * uid에 대한 구독이 없으면 새로 시작합니다.
	 * 이미 구독 중이면 아무것도 하지 않습니다.
	 *
	 * ⚠️ 주의: $effect에서만 호출하세요. $derived에서 호출하면 안 됩니다.
	 *
	 * @param uid - 사용자 UID
	 */
	ensureSubscribed(uid: string | undefined): void {
		// uid가 없으면 무시
		if (!uid) {
			return;
		}

		// Firebase RTDB가 초기화되지 않은 경우
		if (!rtdb) {
			console.error('[UserProfileStore] ❌ Firebase RTDB가 초기화되지 않았습니다.');
			return;
		}

		// 이미 캐시에 있으면 구독 중이므로 무시
		if (this.cache.has(uid)) {
			return;
		}

		// 새로운 프로필 구독 시작
		// console.log(`[UserProfileStore] 🆕 새 프로필 구독 시작: ${uid}`);
		this.subscribeToProfile(uid);
	}

	/**
	 * 캐시된 프로필 데이터 조회 (순수 읽기)
	 *
	 * uid에 해당하는 캐시된 프로필을 반환합니다.
	 * 구독이 없으면 null을 반환합니다.
	 *
	 * ✅ 안전: $derived에서 호출 가능 (상태 변경 없음)
	 *
	 * @param uid - 사용자 UID
	 * @returns 프로필 데이터 (null이면 데이터 없음 또는 로딩 중)
	 *
	 * @example
	 * ```typescript
	 * // $effect에서 구독 시작
	 * $effect(() => {
	 *   userProfileStore.ensureSubscribed('user123');
	 * });
	 *
	 * // $derived에서 데이터 읽기
	 * const profile = $derived(userProfileStore.getCachedProfile('user123'));
	 * ```
	 */
	getCachedProfile(uid: string | undefined): UserProfile | null {
		// uid가 없으면 null 반환
		if (!uid) {
			return null;
		}

		// 캐시에 있으면 데이터 반환
		if (this.cache.has(uid)) {
			const cached = this.cache.get(uid)!;
			return cached.data;
		}

		// 캐시에 없으면 null 반환 (구독 필요)
		return null;
	}

	/**
	 * 프로필 로딩 상태 확인
	 *
	 * @param uid - 사용자 UID
	 * @returns 로딩 중 여부
	 */
	isLoading(uid: string | undefined): boolean {
		if (!uid) return false;
		const cached = this.cache.get(uid);
		return cached?.loading ?? false;
	}

	/**
	 * 프로필 에러 확인
	 *
	 * @param uid - 사용자 UID
	 * @returns 에러 객체 (에러가 없으면 null)
	 */
	getError(uid: string | undefined): Error | null {
		if (!uid) return null;
		const cached = this.cache.get(uid);
		return cached?.error ?? null;
	}

	/**
	 * 프로필 실시간 구독 시작
	 *
	 * @param uid - 사용자 UID
	 */
	private subscribeToProfile(uid: string): void {
		// console.log(`[UserProfileStore] ✅ 프로필 구독 시작: ${uid}`);
		// console.log(`[UserProfileStore] 🔗 RTDB 경로: /users/${uid}`);

		// 초기 캐시 항목 생성 (로딩 상태)
		const cacheItem: ProfileCacheItem = {
			data: null,
			loading: true,
			error: null,
			unsubscribe: null
		};

		this.cache.set(uid, cacheItem);

		// RTDB 리스너 등록
		const userRef = ref(rtdb!, `users/${uid}`);

		// unsubscribe 변수를 먼저 선언 (초기화 전 접근 문제 해결)
		let unsubscribe: Unsubscribe;

		unsubscribe = onValue(
			userRef,
			(snapshot) => {
				// 데이터 로드 성공
				const data = snapshot.val() as UserProfile | null;

				// console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
				// console.log(`[UserProfileStore] 📥 프로필 데이터 수신: ${uid}`);
				// console.log('  수신 시간:', new Date().toISOString());
				// console.log('  데이터:', data);
				// console.log('  photoUrl:', data?.photoUrl);
				// console.log('  displayName:', data?.displayName);
				// console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

				// 🔥 중요: 반응성 트리거를 위해 새로운 객체 생성
				const newCacheItem: ProfileCacheItem = {
					data: data,
					loading: false,
					error: null,
					unsubscribe: unsubscribe
				};

				// Map 자체를 재할당하여 반응성 트리거
				this.cache = new Map(this.cache).set(uid, newCacheItem);

				// console.log(`[UserProfileStore] ✨ 캐시 업데이트 완료: ${uid}`);
				// console.log(`[UserProfileStore] 📊 현재 캐시 크기: ${this.cache.size}`);
			},
			(error) => {
				// 데이터 로드 실패
				console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
				console.error(`[UserProfileStore] ❌ 프로필 로드 실패: ${uid}`);
				console.error('  에러:', error);
				console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

				// 🔥 중요: 반응성 트리거를 위해 새로운 객체 생성
				const newCacheItem: ProfileCacheItem = {
					data: null,
					loading: false,
					error: error as Error,
					unsubscribe: unsubscribe
				};

				// Map 자체를 재할당하여 반응성 트리거
				this.cache = new Map(this.cache).set(uid, newCacheItem);
			}
		);

		// 구독 해제 함수 저장 (초기 설정)
		const item = this.cache.get(uid);
		if (item) {
			const updatedItem: ProfileCacheItem = {
				...item,
				unsubscribe: unsubscribe
			};
			this.cache = new Map(this.cache).set(uid, updatedItem);
		}

		// console.log(`[UserProfileStore] 🎧 RTDB 리스너 등록 완료: ${uid}`);
	}

	/**
	 * 프로필 구독 해제
	 *
	 * 컴포넌트 언마운트 시 호출하여 메모리 누수를 방지합니다.
	 * (일반적으로 자동으로 관리되므로 수동 호출 불필요)
	 *
	 * @param uid - 사용자 UID
	 */
	unsubscribeProfile(uid: string): void {
		const cached = this.cache.get(uid);
		if (cached?.unsubscribe) {
			// console.log(`[UserProfileStore] 🔌 프로필 구독 해제: ${uid}`);
			cached.unsubscribe();
			this.cache.delete(uid);
		}
	}

	/**
	 * 전체 캐시 초기화
	 *
	 * 모든 프로필 구독을 해제하고 캐시를 비웁니다.
	 */
	clearAll(): void {
		// console.log('[UserProfileStore] 🗑️ 전체 캐시 초기화');

		// 모든 리스너 구독 해제
		this.cache.forEach((item, uid) => {
			if (item.unsubscribe) {
				item.unsubscribe();
			}
		});

		// 캐시 비우기
		this.cache.clear();
	}

	/**
	 * 캐시 상태 디버깅
	 *
	 * 개발 환경에서 캐시 상태를 확인할 때 사용합니다.
	 */
	debug(): void {
		// console.log('[UserProfileStore] 📊 캐시 상태:');
		// console.log(`  - 총 구독 수: ${this.cache.size}`);
		this.cache.forEach((item, uid) => {
			// console.log(`  - ${uid}:`, {
			// 	loading: item.loading,
			// 	hasData: !!item.data,
			// 	hasError: !!item.error
			// });
		});
	}
}

/**
 * 전역 사용자 프로필 스토어 인스턴스
 *
 * 애플리케이션 전체에서 하나의 인스턴스만 사용합니다.
 */
export const userProfileStore = new UserProfileStore();

```

