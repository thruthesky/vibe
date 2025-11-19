# Firebase Cloud Functions 테스트 가이드

## 개요

이 디렉토리는 Firebase Cloud Functions의 통합 테스트를 위한 vitest 기반 테스트 코드를 포함합니다.

## 사전 준비

### 1. Firebase Service Account Key 다운로드

테스트를 실행하려면 Firebase Admin SDK 인증을 위한 Service Account Key가 필요합니다.

#### 다운로드 방법:

1. **Firebase Console 접속**
   - https://console.firebase.google.com/project/sonub-firebase 접속

2. **프로젝트 설정 페이지로 이동**
   - 왼쪽 상단의 ⚙️ (설정) 아이콘 클릭
   - **프로젝트 설정(Project Settings)** 선택

3. **서비스 계정 탭으로 이동**
   - 상단 탭에서 **서비스 계정(Service accounts)** 클릭

4. **새 비공개 키 생성**
   - **새 비공개 키 생성(Generate new private key)** 버튼 클릭
   - 확인 다이얼로그에서 **키 생성(Generate key)** 클릭
   - JSON 파일이 자동으로 다운로드됩니다

5. **다운로드한 파일 이동**
   ```bash
   # 다운로드한 JSON 파일을 tests 디렉토리로 이동
   mv ~/Downloads/sonub-firebase-*.json ./firebase/functions/tests/firebase-service-account-key.json
   ```

#### ⚠️ 보안 주의사항

**절대로 Service Account Key를 Git에 커밋하지 마세요!**

- `.gitignore` 파일에 이미 `firebase-service-account-key.json`이 추가되어 있습니다
- 이 파일은 Firebase 프로젝트의 전체 관리자 권한을 가지고 있습니다
- 유출 시 즉시 Firebase Console에서 해당 키를 삭제하고 새로 생성하세요

### 2. 의존성 설치

```bash
cd firebase/functions
npm install
```

## 테스트 실행

### 인플루언서 점수 통합 테스트 실행

```bash
npm run test:influencer
```

### 모든 vitest 테스트 실행

```bash
npm run test:vitest
```

### Watch 모드로 테스트 실행

```bash
npm run test:vitest:watch
```

### UI 모드로 테스트 실행

```bash
npm run test:vitest:ui
```

## 테스트 파일 구조

```
tests/
├── README.md                                    # 이 파일
├── firebase-service-account-key.json           # Service Account Key (Git에 커밋 금지!)
├── influencer-score-integration.test.ts        # 인플루언서 점수 통합 테스트
├── integration/                                 # Mocha 통합 테스트 (기존)
│   ├── onLike.test.ts
│   ├── onPostCreate.test.ts
│   └── test-setup.ts
└── unit/                                        # Mocha 단위 테스트 (기존)
    ├── comment.handler.test.ts
    ├── like.handler.test.ts
    └── user.handler.test.ts
```

## 인플루언서 점수 통합 테스트

### 테스트 범위

`influencer-score-integration.test.ts` 파일은 다음을 검증합니다:

1. **좋아요 기능**
   - ✅ 게시글에 좋아요 시 작성자 점수 +3점 증가
   - ✅ 자기 자신의 게시글 좋아요는 점수 변화 없음 (본인 반응 제외)
   - ✅ 좋아요 취소 시 작성자 점수 -3점 감소

2. **팔로우 기능**
   - ✅ 팔로우 받으면 점수 +60점 증가
   - ✅ 언팔로우 당하면 점수 -60점 감소

3. **통계 집계**
   - ✅ `user-stats/{uid}/total/receivedLikes` 통계 올바르게 집계

### 테스트 실행 방법

```bash
# 1. Service Account Key 파일이 있는지 확인
ls -la firebase/functions/tests/firebase-service-account-key.json

# 2. 테스트 실행
cd firebase/functions
npm run test:influencer
```

### 테스트 출력 예시

```
✓ 게시글에 좋아요를 하면 작성자의 인플루언서 점수가 +3점 증가한다 (12.5s)
✓ 자기 자신의 게시글에 좋아요를 해도 점수가 증가하지 않는다 (10.2s)
✓ 좋아요를 취소하면 작성자의 인플루언서 점수가 -3점 감소한다 (15.8s)
✓ 팔로우를 받으면 인플루언서 점수가 +60점 증가한다 (8.3s)
✓ 언팔로우를 당하면 인플루언서 점수가 -60점 감소한다 (12.1s)
✓ 좋아요 받은 통계가 올바르게 집계된다 (11.7s)

Test Files  1 passed (1)
     Tests  6 passed (6)
  Start at  21:00:00
  Duration  70.6s
```

## 테스트 타임아웃

Cloud Functions가 실행되고 데이터베이스가 업데이트될 때까지 시간이 필요하므로:

- 각 테스트는 **15-20초** 타임아웃 설정
- Firebase 트리거 처리 후 **3초 대기** (await new Promise)
- 전체 테스트 스위트는 약 **1-2분** 소요

## 문제 해결

### Service Account Key 파일이 없다는 에러

```
Error: Service Account Key 파일이 없습니다
```

**해결 방법**: 위의 "[1. Firebase Service Account Key 다운로드](#1-firebase-service-account-key-다운로드)" 섹션을 참고하여 키를 다운로드하세요.

### 권한 에러

```
Error: Permission denied
```

**해결 방법**: Service Account Key가 올바른지 확인하고, Firebase Database Rules에서 Cloud Functions의 쓰기 권한이 허용되어 있는지 확인하세요.

### 타임아웃 에러

```
Error: Test timed out
```

**해결 방법**:
1. Cloud Functions가 정상적으로 배포되어 있는지 확인
2. Firebase Console Logs에서 에러가 없는지 확인
3. 테스트 타임아웃을 늘려보세요 (vitest.config.ts에서 설정)

## 추가 리소스

- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [Vitest 문서](https://vitest.dev/)
- [인플루언서 점수 시스템 스펙](../../../specs/sonub-reactions-stats.md)
- [인플루언서 점수 테스트 계획](../../../specs/sonub-influencer-score-testing.md)
