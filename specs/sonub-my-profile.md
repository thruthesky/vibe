---
name: sonub-my-profile
version: 2.0.0
description: 사용자 프로필 수정 페이지 - 프로필 사진, 닉네임, 성별, 생년월일 관리
author: Claude
email: noreply@anthropic.com
step: 50
priority: "**"
dependencies:
  - sonub-user-overview.md
  - sonub-setup-firebase.md
  - sonub-setup-shadcn.md
  - sonub-firebase-security.md
  - sonub-firebase-database-structure.md
  - sonub-design-components.md
tags:
  - user-profile
  - firebase-storage
  - photo-upload
  - svelte5
  - profile-edit
---

# 프로필 수정 페이지 (`/my/profile`)

## 📋 개요

사용자가 자신의 프로필 정보를 수정할 수 있는 페이지입니다.

- **페이지 경로**: `/my/profile`
- **파일 위치**: `src/routes/my/profile/+page.svelte`
- **주요 기능**:
  - 프로필 사진 업로드/제거
  - 닉네임 수정
  - 성별 선택
  - 생년월일 입력
- **인증**: 로그인한 사용자만 접근 가능
- **데이터 저장**: Firebase Realtime Database (`/users/{uid}`)
- **파일 저장**: Firebase Storage (`users/{uid}/profile/{filename}`)

> **참고**: 본인의 정보 관리 페이지는 `/my/xxx`, 다른 사용자 프로필 조회는 `/user/profile/{uid}` 규칙을 따릅니다.

---

## 🎯 주요 기능

### 1. 프로필 사진 업로드

#### 기능 설명
- 사용자가 클릭하여 이미지 파일을 선택하면 Firebase Storage에 업로드
- 업로드 후 다운로드 URL을 RTDB `/users/{uid}/photoUrl`에 저장
- 미리보기 기능 제공
- 사진 제거 기능 제공

#### 파일 경로
- **Storage 경로**: `users/{uid}/profile/profile_{uid}_{timestamp}.{extension}`
- **예시**: `users/abc123/profile/profile_abc123_1699564800000.jpg`

#### 파일 검증
- **허용 타입**: `image/*` (모든 이미지 타입)
- **최대 크기**: 5MB (5 * 1024 * 1024 bytes)
- **검증 실패 시**: 에러 메시지 표시 후 업로드 중단

#### UI 구성
- **프로필 이미지**: 128x128px 원형 (rounded-full)
- **기본 이미지**: 회색 배경 + 👤 이모지
- **카메라 아이콘 배지**: 우측 하단, 파란색 원형 버튼
- **X 버튼**: 우측 상단, 빨간색 원형 버튼 (사진 있을 때만 표시)
- **업로드 중 표시**: 회전하는 스피너 아이콘

#### Avatar 컴포넌트 연동 (2025-02 업데이트)
- 버튼 내부의 기본 출력은 `src/lib/components/user/avatar.svelte`를 그대로 사용합니다.
- 코드 스니펫:

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

  ```svelte
  <button class="relative h-32 w-32 overflow-hidden rounded-full ...">
    <Avatar uid={authStore.user.uid} size={128} class="pointer-events-none" />

    {#if photoPreview}
      <img
        src={photoPreview}
        alt="업로드 미리보기"
        class="absolute inset-0 h-full w-full object-cover pointer-events-none"
      />
    {/if}
  </button>
  ```
- Avatar는 저장된 RTDB 사진(또는 displayName 첫 글자)을 항상 일관된 스타일로 보여 주고, `photoPreview`는 절대 배치된 `<img>`로 덮어씌워 즉시 미리보기를 제공합니다.
- `pointer-events-none`을 적용하여 미리보기 이미지가 버튼 클릭을 방해하지 않도록 합니다.

### 2. 닉네임 (displayName)

- **타입**: 텍스트 입력 필드
- **필수 여부**: 필수 (*)
- **최대 길이**: 50자
- **유효성 검증**:
  - 빈 값 방지
  - 길이 제한 (50자)
  - 공백 trim 처리

### 3. 성별 (gender)

- **타입**: Select 드롭다운
- **필수 여부**: 선택 사항
- **허용 값**:
  - `''`: 선택 안 함
  - `'M'`: 남성
  - `'F'`: 여성
- **저장 방식**: 선택된 경우에만 RTDB에 저장

### 4. 생년월일 (dateOfBirth)

- **타입**: 3개의 Select 드롭다운 (년/월/일)
- **필수 여부**: 선택 사항
- **년도 범위**:
  - 최소: `currentYear - 70` (70년 전)
  - 최대: `currentYear - 18` (18년 전, 만 18세 이상만 가입)
- **월 범위**: 1 ~ 12
- **일 범위**: 1 ~ 31
- **저장 형식**: `YYYY-MM-DD` (예: `2000-01-15`)
- **유효성 검증**: 미래 날짜 방지

---

## 🔧 기술 구현

### State 변수

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```typescript
// 폼 데이터 상태
let displayName = $state('');
let photoUrl = $state(''); // 프로필 사진 URL
let gender = $state<'M' | 'F' | ''>('');
let birthYear = $state<number | null>(null);
let birthMonth = $state<number | null>(null);
let birthDay = $state<number | null>(null);

// UI 상태
let loading = $state(false); // 프로필 로드 중
let saving = $state(false); // 프로필 저장 중
let successMessage = $state('');
let errorMessage = $state('');
let photoPreview = $state<string | null>(null); // 사진 미리보기 URL
let fileInput: HTMLInputElement | null = null; // 파일 input 참조
let isPhotoUploading = $state(false); // 사진 업로드 중 상태
```

### 주요 함수

#### 1. `loadProfile()` - 프로필 데이터 로드

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```typescript
/**
 * 사용자 프로필 데이터 로드
 * - RTDB에서 displayName, photoUrl, gender, dateOfBirth 조회
 * - 신규 사용자의 경우 Firebase Auth displayName 사용
 * - dateOfBirth를 year/month/day로 파싱
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
			photoUrl = userData.photoUrl || '';
			gender = userData.gender || '';

			// dateOfBirth 파싱 (YYYY-MM-DD 형식)
			if (userData.dateOfBirth) {
				const parts = userData.dateOfBirth.split('-');
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
		errorMessage = '프로필 정보를 불러오는데 실패했습니다.';
	} finally {
		loading = false;
	}
}
```

#### 2. `handlePhotoClick()` - 파일 선택 트리거

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```typescript
/**
 * 파일 input 클릭 트리거
 * - 숨겨진 file input을 프로그래밍 방식으로 클릭
 */
function handlePhotoClick() {
	fileInput?.click();
}
```

#### 3. `handlePhotoChange()` - 파일 선택 처리

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```typescript
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
		errorMessage = '이미지 파일만 업로드할 수 있습니다.';
		return;
	}

	// 파일 크기 검증 (5MB)
	const maxSize = 5 * 1024 * 1024; // 5MB
	if (file.size > maxSize) {
		errorMessage = '파일 크기는 5MB 이하여야 합니다.';
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
```

#### 4. `uploadPhoto()` - Firebase Storage 업로드

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```typescript
/**
 * Firebase Storage에 사진 업로드
 * - 파일명: profile_{uid}_{timestamp}.{extension}
 * - 경로: users/{uid}/profile/{filename}
 * - 업로드 후 download URL을 photoUrl에 저장
 */
async function uploadPhoto(file: File) {
	if (!authStore.user?.uid || !storage) {
		errorMessage = '로그인이 필요합니다.';
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

		successMessage = '프로필 사진이 업로드되었습니다.';

		// 3초 후 성공 메시지 제거
		setTimeout(() => {
			successMessage = '';
		}, 3000);
	} catch (error) {
		console.error('사진 업로드 실패:', error);
		errorMessage = '사진 업로드에 실패했습니다. 다시 시도해주세요.';
		photoPreview = null;
	} finally {
		isPhotoUploading = false;
	}
}
```

#### 5. `handleRemovePhoto()` - 프로필 사진 제거

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```typescript
/**
 * 프로필 사진 제거
 * - photoUrl과 photoPreview를 null로 설정
 * - RTDB에서 photoUrl 필드 제거
 */
async function handleRemovePhoto() {
	if (!authStore.user?.uid || !rtdb) {
		errorMessage = '로그인이 필요합니다.';
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

		successMessage = '프로필 사진이 제거되었습니다.';

		// 3초 후 성공 메시지 제거
		setTimeout(() => {
			successMessage = '';
		}, 3000);
	} catch (error) {
		console.error('사진 제거 실패:', error);
		errorMessage = '사진 제거에 실패했습니다. 다시 시도해주세요.';
	} finally {
		isPhotoUploading = false;
	}
}
```

#### 6. `handleSave()` - 프로필 저장

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```typescript
/**
 * 프로필 저장
 * - displayName 유효성 검증 (필수, 50자 이하)
 * - gender 선택 시에만 저장
 * - dateOfBirth 모두 선택 시에만 YYYY-MM-DD 형식으로 저장
 * - photoUrl이 있으면 저장
 */
async function handleSave() {
	if (!authStore.user?.uid || !rtdb) {
		errorMessage = '로그인이 필요합니다.';
		return;
	}

	// 유효성 검증
	if (!displayName.trim()) {
		errorMessage = '닉네임을 입력해주세요.';
		return;
	}

	if (displayName.length > 50) {
		errorMessage = '닉네임은 50자 이하여야 합니다.';
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
			updateData.dateOfBirth = `${birthYear}-${month}-${day}`;

			// 미래 날짜 검증
			const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
			if (birthDate > new Date()) {
				errorMessage = '생년월일은 과거여야 합니다.';
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

		successMessage = '프로필이 성공적으로 업데이트되었습니다.';

		// 3초 후 성공 메시지 제거
		setTimeout(() => {
			successMessage = '';
		}, 3000);
	} catch (error) {
		console.error('프로필 저장 실패:', error);
		errorMessage = '프로필 저장에 실패했습니다. 다시 시도해주세요.';
	} finally {
		saving = false;
	}
}
```

### 라이프사이클

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```typescript
/**
 * 컴포넌트 마운트 시 프로필 로드
 * - authStore.initialized가 true가 되면 실행
 * - 비로그인 사용자는 /user/login으로 리다이렉트
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
```

---

## 🎨 UI 컴포넌트

### 프로필 사진 섹션

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```svelte
<!-- 프로필 사진 -->
<div class="space-y-2">
	<label class="block text-sm font-medium text-gray-700"> 프로필 사진 </label>
	<div class="flex items-center justify-center">
		<div class="relative">
			<!-- 사진 미리보기 또는 기본 회색 원 -->
			<button
				type="button"
				onclick={handlePhotoClick}
				disabled={isPhotoUploading}
				class="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100 transition-all hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if photoPreview || photoUrl}
					<!-- 업로드된 사진 표시 -->
					<img
						src={photoPreview || photoUrl}
						alt="프로필 사진"
						class="h-full w-full object-cover"
					/>
				{:else}
					<!-- 기본 회색 배경 -->
					<div class="flex h-full w-full items-center justify-center">
						<span class="text-4xl text-gray-400">👤</span>
					</div>
				{/if}

				<!-- 카메라 아이콘 배지 -->
				<div
					class="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg"
				>
					{#if isPhotoUploading}
						<!-- 업로드 중 표시 -->
						<svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					{:else}
						<Camera class="h-5 w-5" />
					{/if}
				</div>
			</button>

			<!-- 사진 제거 버튼 (사진이 있을 때만 표시) -->
			{#if (photoUrl || photoPreview) && !isPhotoUploading}
				<button
					type="button"
					onclick={handleRemovePhoto}
					class="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white shadow-lg transition-all hover:bg-red-600"
					title="사진 제거"
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
		클릭하여 프로필 사진 업로드 (최대 5MB)
	</p>
</div>
```

### 사용된 UI 컴포넌트

- **Card**: shadcn-svelte Card 컴포넌트 (Card.Root, Card.Header, Card.Title, Card.Description, Card.Content)
- **Button**: shadcn-svelte Button 컴포넌트
- **Alert**: shadcn-svelte Alert 컴포넌트 (Alert.Root, Alert.Title, Alert.Description)
- **Icons**: lucide-svelte (Camera, X)

> **참고**: UI 컴포넌트 상세 설명은 [sonub-design-components.md](./sonub-design-components.md) 참조

---

## 🔒 보안 규칙

### Firebase Realtime Database

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```json
{
  "users": {
    "$uid": {
      ".read": "auth.uid == $uid",
      ".write": "now < 1765555200000 || auth.uid == $uid",
      ".validate": "newData.hasChildren(['displayName'])"
    }
  }
}
```

### Firebase Storage

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/profile/{fileName=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
      allow delete: if request.auth.uid == userId;
    }
  }
}
```

> **참고**: 보안 규칙 상세 설명은 [sonub-firebase-security.md](./sonub-firebase-security.md) 참조

---

## 📊 데이터 구조

### RTDB `/users/{uid}`

**소스 코드 위치**: [+layout.svelte.md](./repository/src/routes/my/+layout.svelte.md)

```json
{
  "displayName": "홍길동",
  "photoUrl": "https://firebasestorage.googleapis.com/.../profile_abc123_1699564800000.jpg",
  "gender": "M",
  "dateOfBirth": "1990-01-15"
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `displayName` | `string` | ✅ | 사용자 닉네임 (최대 50자) |
| `photoUrl` | `string` | ❌ | 프로필 사진 URL (Firebase Storage) |
| `gender` | `'M' \| 'F'` | ❌ | 성별 (M: 남성, F: 여성) |
| `dateOfBirth` | `string` | ❌ | 생년월일 (YYYY-MM-DD 형식) |

---

## 🧪 테스트 시나리오

### 1. 프로필 사진 업로드

1. 로그인 후 `/my/profile` 접근
2. 프로필 사진 영역 클릭
3. 이미지 파일 선택
4. 업로드 중 스피너 표시 확인
5. 업로드 완료 후 미리보기 확인
6. RTDB `/users/{uid}/photoUrl` 필드 확인
7. Storage `users/{uid}/profile/` 경로에 파일 저장 확인

### 2. 프로필 사진 제거

1. 프로필 사진이 있는 상태에서 X 버튼 클릭
2. 사진이 기본 이미지로 변경되는지 확인
3. RTDB `/users/{uid}/photoUrl` 필드가 null로 변경되는지 확인

### 3. 닉네임 수정

1. 닉네임 입력 필드에 값 입력
2. 빈 값 입력 시 에러 메시지 확인
3. 51자 이상 입력 시 에러 메시지 확인
4. 정상 값 저장 후 RTDB 확인

### 4. 생년월일 입력

1. 년/월/일 선택
2. 미래 날짜 선택 시 에러 메시지 확인
3. 정상 날짜 저장 후 RTDB에 YYYY-MM-DD 형식으로 저장되는지 확인

### 5. 비로그인 접근

1. 로그아웃 상태에서 `/my/profile` 접근
2. `/user/login`으로 리다이렉트되는지 확인

---

## 📝 참고 문서

- [sonub-firebase-security.md](./sonub-firebase-security.md) - Firebase Security Rules
- [sonub-design-components.md](./sonub-design-components.md) - UI 컴포넌트
- [sonub-setup-firebase.md](./sonub-setup-firebase.md) - Firebase 설정
- [Firebase Storage 문서](https://firebase.google.com/docs/storage)
- [Firebase Realtime Database 문서](https://firebase.google.com/docs/database)
