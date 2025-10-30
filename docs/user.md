# 사용자 관리 기능 문서

사용자 관련 모든 기능, API, 데이터 구조에 대한 상세 문서입니다.

---

## 📋 목차

1. [개요](#개요)
2. [데이터 구조](#데이터-구조)
3. [주요 기능](#주요-기능)
4. [API 함수](#api-함수)
5. [페이지/라우트](#페이지라우트)
6. [Firebase Realtime Database 구조](#firebase-realtime-database-구조)
7. [사용 예제](#사용-예제)

---

## 개요

Vibe 프로젝트의 **사용자 관리 시스템**은 다음 세 가지 기술 스택을 활용합니다:

- **Firebase Authentication**: 사용자 인증 (로그인, 회원가입, 로그아웃)
- **Firebase Realtime Database (RTDB)**: 사용자 프로필 정보 저장
- **Firebase Storage**: 사용자 프로필 사진 업로드 및 저장

### 핵심 개념

- **UID**: Firebase에서 발급하는 고유한 사용자 ID
- **displayName**: 사용자의 표시 이름 (닉네임, 실명 등)
- **photoUrl**: 사용자 프로필 사진의 URL
- **RTDB**: 실시간 데이터베이스로 사용자 추가 정보 저장
- **Storage**: 클라우드 파일 저장소로 사진 파일 보관

---

## 데이터 구조

### Firebase Authentication의 User 객체

```typescript
{
  uid: string;              // 고유 사용자 ID
  email: string;            // 이메일
  displayName?: string;     // 표시 이름 (선택사항)
  photoURL?: string;        // 프로필 사진 URL (선택사항)
  emailVerified: boolean;   // 이메일 인증 여부
  isAnonymous: boolean;     // 익명 사용자 여부
}
```

### RTDB의 사용자 정보 구조

```
/{ROOT_FOLDER}/users/
├── <uid1>/
│   ├── displayName: "사용자1"
│   ├── email: "user1@example.com"
│   ├── photoUrl: "https://firebasestorage.googleapis.com/..."
│   └── createdAt: 1698473000000
├── <uid2>/
│   ├── displayName: "사용자2"
│   ├── email: "user2@example.com"
│   ├── photoUrl: "https://firebasestorage.googleapis.com/..."
│   └── createdAt: 1698473100000
└── <uid3>/
    ├── displayName: "사용자3"
    ├── email: "user3@example.com"
    └── createdAt: 1698473200000
```

---

## 주요 기능

### 1. 회원 정보 수정 (`/profile`)

사용자의 **displayName** (표시 이름)을 수정하는 기능입니다.

**경로**: `/profile`

**동작 방식**:
1. 로그인한 사용자만 접근 가능
2. 현재 displayName 표시
3. 새로운 displayName 입력
4. 저장 버튼 클릭 시 RTDB에 저장
5. 저장 완료 후 홈페이지로 리다이렉트

**저장 위치**: `/{ROOT_FOLDER}/users/<uid>/displayName`

**수정할 수 있는 정보**:
- ✅ displayName (사용자 이름)

**향후 추가될 정보** (개발 예정):
- 프로필 사진
- 자기소개
- 관심사 등

### 2. 프로필 사진 업로드 (`/profile`)

사용자의 프로필 사진을 업로드하는 기능입니다.

**경로**: `/profile`

**동작 방식**:
1. 로그인한 사용자만 접근 가능
2. 현재 프로필 사진 표시 (있을 경우)
3. 사진 파일 선택 (JPEG, PNG, WebP, GIF 지원)
4. 파일 크기 확인 (10MB 이하)
5. Firebase Storage에 업로드
6. 업로드된 사진 URL을 RTDB에 저장
7. 성공 메시지 표시

**저장 위치**:
- **Storage**: `/users/<uid>/profile.<확장자>`
- **RTDB**: `/{ROOT_FOLDER}/users/<uid>/photoUrl`

**지원 형식**: JPEG, PNG, WebP, GIF (10MB 이하)

### 3. 사용자 목록 (향후 구현 예정)

사용자들의 프로필을 목록으로 보여주는 기능입니다.

**경로**: `/users` (구현 예정)

---

## API 함수

모든 사용자 관련 함수는 `/lib/user.ts`에 정의되어 있습니다.

### saveUserDisplayName()

**사용자의 displayName을 RTDB에 저장합니다.**

```typescript
async function saveUserDisplayName(
  uid: string,
  displayName: string
): Promise<{ success: boolean; error?: string }>
```

**매개변수**:
- `uid` (string): 사용자의 Firebase UID
- `displayName` (string): 저장할 표시 이름

**반환값**:
- `success` (boolean): 저장 성공 여부
- `error` (string, 선택): 오류 메시지

**저장 위치**: `/{ROOT_FOLDER}/users/<uid>/displayName`

**사용 예제**:
```typescript
const result = await saveUserDisplayName("user123", "홍길동");
if (result.success) {
  console.log("저장 성공!");
} else {
  console.error("오류:", result.error);
}
```

---

### getUserDisplayName()

**사용자의 displayName을 RTDB에서 조회합니다.**

```typescript
async function getUserDisplayName(uid: string): Promise<string | null>
```

**매개변수**:
- `uid` (string): 사용자의 Firebase UID

**반환값**:
- `string | null`: 저장된 displayName, 없으면 null

**조회 위치**: `/{ROOT_FOLDER}/users/<uid>/displayName`

**사용 예제**:
```typescript
const displayName = await getUserDisplayName("user123");
if (displayName) {
  console.log("사용자 이름:", displayName);
} else {
  console.log("저장된 이름이 없습니다.");
}
```

---

### getUserData()

**사용자의 모든 정보를 RTDB에서 조회합니다.**

```typescript
async function getUserData(
  uid: string
): Promise<{ [key: string]: any } | null>
```

**매개변수**:
- `uid` (string): 사용자의 Firebase UID

**반환값**:
- `{ [key: string]: any } | null`: 사용자 정보 객체, 없으면 null

**조회 위치**: `/{ROOT_FOLDER}/users/<uid>`

**사용 예제**:
```typescript
const userData = await getUserData("user123");
if (userData) {
  console.log("사용자 정보:", userData);
  // 결과: { displayName: "홍길동", email: "user@example.com", ... }
}
```

---

### uploadProfilePhoto()

**사용자의 프로필 사진을 Firebase Storage에 업로드하고 URL을 RTDB에 저장합니다.**

```typescript
async function uploadProfilePhoto(
  uid: string,
  file: File
): Promise<{ success: boolean; photoUrl?: string; error?: string }>
```

**매개변수**:
- `uid` (string): 사용자의 Firebase UID
- `file` (File): 업로드할 이미지 파일

**반환값**:
- `success` (boolean): 업로드 성공 여부
- `photoUrl` (string, 선택): 업로드된 사진의 URL
- `error` (string, 선택): 오류 메시지

**저장 위치**:
- **Storage**: `/users/<uid>/profile.<확장자>`
- **RTDB**: `/{ROOT_FOLDER}/users/<uid>/photoUrl`

**유효성 검사**:
- 파일 크기: 10MB 이하
- 지원 형식: JPEG, PNG, WebP, GIF

**사용 예제**:
```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput?.files?.[0];

if (file) {
  const result = await uploadProfilePhoto("user123", file);
  if (result.success) {
    console.log("업로드 성공! 사진 URL:", result.photoUrl);
  } else {
    console.error("업로드 실패:", result.error);
  }
}
```

---

### getUserPhotoUrl()

**사용자의 프로필 사진 URL을 RTDB에서 조회합니다.**

```typescript
async function getUserPhotoUrl(uid: string): Promise<string | null>
```

**매개변수**:
- `uid` (string): 사용자의 Firebase UID

**반환값**:
- `string | null`: 저장된 photoUrl, 없으면 null

**조회 위치**: `/{ROOT_FOLDER}/users/<uid>/photoUrl`

**사용 예제**:
```typescript
const photoUrl = await getUserPhotoUrl("user123");
if (photoUrl) {
  console.log("프로필 사진 URL:", photoUrl);
  // 이미지 태그에 설정
  const img = document.querySelector('img');
  if (img) img.src = photoUrl;
} else {
  console.log("프로필 사진이 없습니다.");
}
```

---

### saveUserData()

**사용자의 전체 정보를 RTDB에 저장합니다.**

```typescript
async function saveUserData(
  uid: string,
  userData: { [key: string]: any }
): Promise<{ success: boolean; error?: string }>
```

**매개변수**:
- `uid` (string): 사용자의 Firebase UID
- `userData` (object): 저장할 사용자 정보

**반환값**:
- `success` (boolean): 저장 성공 여부
- `error` (string, 선택): 오류 메시지

**저장 위치**: `/{ROOT_FOLDER}/users/<uid>`

**사용 예제**:
```typescript
const userData = {
  displayName: "홍길동",
  email: "user@example.com",
  createdAt: Date.now(),
};

const result = await saveUserData("user123", userData);
if (result.success) {
  console.log("사용자 정보 저장 성공!");
}
```

---

## 페이지/라우트

### `/auth/signup` - 회원가입
- **파일**: `/app/auth/signup/page.tsx`
- **기능**: 새로운 사용자 계정 생성
- **입력**: 이메일, 비밀번호, displayName
- **저장 위치**: Firebase Authentication + RTDB `/{ROOT_FOLDER}/users/<uid>`

### `/auth/login` - 로그인
- **파일**: `/app/auth/login/page.tsx`
- **기능**: 기존 사용자 로그인
- **입력**: 이메일, 비밀번호
- **결과**: 인증 토큰 발급 및 `/`로 리다이렉트

### `/` - 홈페이지
- **파일**: `/app/page.tsx`
- **기능**: 현재 로그인 상태 표시
- **로그인 시 표시**: 사용자 ID, 회원 정보 수정 버튼, 로그아웃 버튼
- **미로그인 시 표시**: 로그인 버튼, 회원가입 버튼

### `/profile` - 회원 정보 수정 및 사진 업로드
- **파일**: `/app/profile/page.tsx`
- **기능**: displayName 수정, 프로필 사진 업로드
- **입력**: 새로운 displayName, 이미지 파일
- **저장 위치**:
  - RTDB: `/{ROOT_FOLDER}/users/<uid>/displayName`
  - RTDB: `/{ROOT_FOLDER}/users/<uid>/photoUrl`
  - Storage: `/users/<uid>/profile.<확장자>`
- **접근 제한**: 로그인한 사용자만 가능

---

## Firebase Realtime Database 구조

**참고**: 이 문서에서 사용하는 경로는 모두 `/{ROOT_FOLDER}/` 접두사를 사용합니다. `ROOT_FOLDER`는 `app/app.config.ts`에 정의된 상수로, 현재 기본값은 `"vibe"`입니다. 따라서 실제 경로는 `/vibe/users` 형태가 됩니다.

### RTDB 경로 설명

#### `/{ROOT_FOLDER}/users/<uid>/displayName`

**용도**: 사용자의 표시 이름 저장

**데이터 타입**: String

**예시**:
```
/{ROOT_FOLDER}/users/abc123xyz/displayName = "홍길동"
/{ROOT_FOLDER}/users/def456uvw/displayName = "김유신"
```

**생성 시점**: 회원가입 또는 `/profile` 페이지에서 처음 저장 시

**수정 방법**:
1. `/profile` 페이지에서 수정
2. 직접 `saveUserDisplayName()` 함수 호출

#### `/{ROOT_FOLDER}/users/<uid>/photoUrl`

**용도**: 사용자의 프로필 사진 URL 저장

**데이터 타입**: String (Firebase Storage URL)

**예시**:
```
/{ROOT_FOLDER}/users/abc123xyz/photoUrl = "https://firebasestorage.googleapis.com/v0/b/vibe.../users/abc123xyz/profile.jpeg?alt=media"
```

**생성 시점**: `uploadProfilePhoto()` 함수로 사진 업로드 시

**수정 방법**:
1. `/profile` 페이지에서 새 사진 업로드
2. 직접 `uploadProfilePhoto()` 함수 호출

#### `/{ROOT_FOLDER}/users/<uid>` (전체 사용자 데이터)

**용도**: 사용자의 모든 정보 저장

**데이터 타입**: Object

**예시**:
```json
{
  "abc123xyz": {
    "displayName": "홍길동",
    "email": "hong@example.com",
    "photoUrl": "https://firebasestorage.googleapis.com/v0/b/vibe.../users/abc123xyz/profile.jpeg?alt=media",
    "createdAt": 1698473000000
  },
  "def456uvw": {
    "displayName": "김유신",
    "email": "kim@example.com",
    "photoUrl": "https://firebasestorage.googleapis.com/v0/b/vibe.../users/def456uvw/profile.png?alt=media",
    "createdAt": 1698473100000
  }
}
```

---

## 사용 예제

### 예제 1: 사용자가 홈페이지에서 회원 정보 수정 페이지 접근

**흐름**:
```
1. 사용자가 로그인된 상태에서 홈페이지(`/`) 방문
2. "회원 정보 수정" 버튼 클릭
3. `/profile` 페이지로 이동
4. 현재 displayName 표시 (Firebase Auth의 displayName 우선, 없으면 RTDB에서 조회)
5. 새로운 displayName 입력
6. "저장" 버튼 클릭
7. saveUserDisplayName() 함수 호출로 RTDB에 저장
8. 성공 메시지 표시 후 홈페이지로 리다이렉트
```

### 예제 2: 사용자 displayName 직접 저장 (개발자용)

```typescript
import { saveUserDisplayName } from "@/lib/user";

// 사용자 ID와 새로운 이름으로 저장
const result = await saveUserDisplayName("user-uid-12345", "새로운이름");

if (result.success) {
  console.log("저장 완료!");
} else {
  console.error("저장 실패:", result.error);
}
```

### 예제 3: 사용자 정보 조회 및 사용

```typescript
import { getUserDisplayName, getUserData } from "@/lib/user";

// displayName만 조회
const displayName = await getUserDisplayName("user-uid-12345");
console.log(`사용자 이름: ${displayName}`);

// 전체 사용자 정보 조회
const userData = await getUserData("user-uid-12345");
console.log("사용자 정보:", userData);
```

### 예제 4: 프로필 사진 업로드

```typescript
import { uploadProfilePhoto, getUserPhotoUrl } from "@/lib/user";

// 사진 파일 선택 후 업로드
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput?.files?.[0];

if (file) {
  const result = await uploadProfilePhoto("user-uid-12345", file);

  if (result.success) {
    console.log("✅ 사진 업로드 성공!");
    console.log("사진 URL:", result.photoUrl);

    // 이미지에 바로 반영
    const img = document.querySelector('img') as HTMLImageElement;
    if (img) {
      img.src = result.photoUrl;
    }
  } else {
    console.error("❌ 업로드 실패:", result.error);
  }
}
```

### 예제 5: 저장된 프로필 사진 조회

```typescript
import { getUserPhotoUrl } from "@/lib/user";

// 저장된 프로필 사진 URL 조회
const photoUrl = await getUserPhotoUrl("user-uid-12345");

if (photoUrl) {
  // 프로필 이미지 표시
  const profileImg = document.querySelector('#profile-photo') as HTMLImageElement;
  if (profileImg) {
    profileImg.src = photoUrl;
    profileImg.alt = "프로필 사진";
  }
} else {
  console.log("프로필 사진이 없습니다.");
}
```

---

## 보안 고려사항

### Firebase Realtime Database 보안 규칙 (권장)

```json
{
  "rules": {
    "vibe": {
      "users": {
        "$uid": {
          ".read": "auth.uid === $uid || root.child('admin').child(auth.uid).exists()",
          ".write": "auth.uid === $uid"
        }
      }
    }
  }
}
```

**설명**:
- 사용자는 자신의 정보만 읽을 수 있음
- 관리자는 모든 사용자 정보 읽을 수 있음
- 사용자는 자신의 정보만 수정할 수 있음

---

## 향후 추가될 기능

- [x] 프로필 사진 업로드 (✅ 완료)
- [ ] 자기소개 수정
- [ ] 관심사/선호도 설정
- [ ] 계정 삭제 기능
- [ ] 사용자 검색 기능
- [ ] 사용자 목록 (`/users`) 페이지 구현

---

## 참고 링크

- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- [Firebase Realtime Database 문서](https://firebase.google.com/docs/database)
- Vibe 프로젝트 CLAUDE.md: 개발 워크플로우 및 표준 가이드

---

**마지막 업데이트**: 2025년 10월 30일
**버전**: 1.1.0
**상태**: 활성
**인코딩**: UTF-8
