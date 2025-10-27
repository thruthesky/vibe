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

Vibe 프로젝트의 **사용자 관리 시스템**은 다음 두 가지 기술 스택을 활용합니다:

- **Firebase Authentication**: 사용자 인증 (로그인, 회원가입, 로그아웃)
- **Firebase Realtime Database (RTDB)**: 사용자 프로필 정보 저장

### 핵심 개념

- **UID**: Firebase에서 발급하는 고유한 사용자 ID
- **displayName**: 사용자의 표시 이름 (닉네임, 실명 등)
- **RTDB**: 실시간 데이터베이스로 사용자 추가 정보 저장

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
/vibe/users/
├── <uid1>/
│   ├── displayName: "사용자1"
│   ├── email: "user1@example.com"
│   └── createdAt: 1698473000000
├── <uid2>/
│   ├── displayName: "사용자2"
│   ├── email: "user2@example.com"
│   └── createdAt: 1698473100000
└── <uid3>/
    └── displayName: "사용자3"
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

**저장 위치**: `/vibe/users/<uid>/displayName`

**수정할 수 있는 정보**:
- ✅ displayName (사용자 이름)

**향후 추가될 정보** (개발 예정):
- 프로필 사진
- 자기소개
- 관심사 등

### 2. 사용자 목록 (향후 구현 예정)

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

**저장 위치**: `/vibe/users/<uid>/displayName`

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

**조회 위치**: `/vibe/users/<uid>/displayName`

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

**조회 위치**: `/vibe/users/<uid>`

**사용 예제**:
```typescript
const userData = await getUserData("user123");
if (userData) {
  console.log("사용자 정보:", userData);
  // 결과: { displayName: "홍길동", email: "user@example.com", ... }
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

**저장 위치**: `/vibe/users/<uid>`

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
- **저장 위치**: Firebase Authentication + RTDB `/vibe/users/<uid>`

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

### `/profile` - 회원 정보 수정
- **파일**: `/app/profile/page.tsx`
- **기능**: displayName 수정
- **입력**: 새로운 displayName
- **저장 위치**: RTDB `/vibe/users/<uid>/displayName`
- **접근 제한**: 로그인한 사용자만 가능

---

## Firebase Realtime Database 구조

### RTDB 경로 설명

#### `/vibe/users/<uid>/displayName`

**용도**: 사용자의 표시 이름 저장

**데이터 타입**: String

**예시**:
```
/vibe/users/abc123xyz/displayName = "홍길동"
/vibe/users/def456uvw/displayName = "김유신"
```

**생성 시점**: 회원가입 또는 `/profile` 페이지에서 처음 저장 시

**수정 방법**:
1. `/profile` 페이지에서 수정
2. 직접 `saveUserDisplayName()` 함수 호출

#### `/vibe/users/<uid>` (전체 사용자 데이터)

**용도**: 사용자의 모든 정보 저장

**데이터 타입**: Object

**예시**:
```json
{
  "abc123xyz": {
    "displayName": "홍길동",
    "email": "hong@example.com",
    "createdAt": 1698473000000
  },
  "def456uvw": {
    "displayName": "김유신",
    "email": "kim@example.com",
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

- [ ] 프로필 사진 업로드
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

**마지막 업데이트**: 2025년 10월 27일
**버전**: 1.0.0
**상태**: 활성
**인코딩**: UTF-8
