# 인플루언서 점수 통합 테스트 결과 보고서

## 1. 테스트 개요

**테스트 날짜**: 2025-01-19
**테스트 버전**: 1.6.0
**수정 사항**: 좋아요 통계 핸들러 데이터 구조 불일치 문제 해결

---

## 2. 발견된 문제 및 해결

### 문제: 좋아요 시 인플루언서 점수가 증가하지 않음

**원인**:
- 클라이언트는 `/likes/{uid}/{targetId}` 경로에 **문자열 값**을 저장 (예: `"post"`, `"comment"`)
- 통계 핸들러는 **객체**로 읽으려고 시도하여 `likeData.targetType`이 항상 `undefined`가 됨
- 핸들러에서 `targetType`이 없으면 early return하여 통계가 집계되지 않음

**해결 방법**:
```typescript
// 수정 전 (잘못됨)
const likeData = (event.data.val() || {}) as Record<string, unknown>;
const targetType = likeData.targetType; // undefined

// 수정 후 (올바름)
const targetType = event.data.val() as string; // "post", "comment" 등
await handleLikeCreateStats(likerUid, targetId, { targetType, createdAt: Date.now() });
```

**수정 파일**:
- `firebase/functions/src/index.ts` (라인 1429-1450, 1464-1486)

**배포 완료**:
- ✅ Firebase Functions 배포 성공 (2025-01-19)
- ✅ `onLikeCreatedStats` 함수 업데이트
- ✅ `onLikeDeletedStats` 함수 업데이트

---

## 3. 실제 테스트 방법

### 3.1. Firebase Console에서 실시간 모니터링

**Realtime Database 확인**:
1. https://console.firebase.google.com/project/sonub-firebase/database 접속
2. 다음 경로들을 확인:
   - `/influencer-scores/{uid}` - 사용자 인플루언서 점수
   - `/user-stats/{uid}/total` - 사용자 전체 통계
   - `/user-stats/{uid}/daily/{yyyyMMdd}` - 사용자 일간 통계
   - `/influencer-rankings/total` - 전체 Top 100 순위
   - `/influencer-rankings/daily/{yyyyMMdd}` - 일간 Top 100 순위

**Functions Logs 확인**:
1. https://console.firebase.google.com/project/sonub-firebase/functions/logs 접속
2. 필터링: `onLikeCreatedStats`, `onLikeDeletedStats` 등

---

### 3.2. 앱에서 직접 테스트

#### 테스트 시나리오 1: 게시글 좋아요 (+3점)

**사전 준비**:
- 사용자 A: 게시글 작성자
- 사용자 B: 좋아요를 누를 사용자

**테스트 단계**:
1. 사용자 A로 로그인 → 게시글 작성
2. 사용자 B로 로그인 → 사용자 A의 게시글에 좋아요 클릭
3. 사용자 A의 프로필 페이지 확인 → 인플루언서 점수 +3점 확인

**예상 결과**:
```
/influencer-scores/{userA_uid} = 3
/user-stats/{userA_uid}/total/receivedLikes = 1
```

**Firebase Logs에서 확인할 내용**:
```
좋아요 생성 통계 트리거 { likerUid: 'userB', targetId: 'postId', targetType: 'post' }
대상 작성자 UID: userA
인플루언서 점수 증가: +3점
```

---

#### 테스트 시나리오 2: 본인 좋아요 (점수 변화 없음)

**테스트 단계**:
1. 사용자 A로 로그인
2. 자신이 작성한 게시글에 좋아요 클릭

**예상 결과**:
- 인플루언서 점수 변화 없음

**Firebase Logs에서 확인할 내용**:
```
자기 자신에게 한 좋아요는 통계에서 제외됩니다
```

---

#### 테스트 시나리오 3: 댓글 작성 (+10점)

**테스트 단계**:
1. 사용자 A로 로그인 → 게시글 작성
2. 사용자 B로 로그인 → 사용자 A의 게시글에 댓글 작성
3. 사용자 A의 프로필 페이지 확인 → 인플루언서 점수 +10점 확인

**예상 결과**:
```
/influencer-scores/{userA_uid} = 13 (3 + 10)
/user-stats/{userA_uid}/total/receivedComments = 1
```

---

#### 테스트 시나리오 4: 팔로우 (+60점)

**테스트 단계**:
1. 사용자 B로 로그인
2. 사용자 A를 팔로우
3. 사용자 A의 프로필 페이지 확인 → 인플루언서 점수 +60점 확인

**예상 결과**:
```
/influencer-scores/{userA_uid} = 73 (13 + 60)
/user-stats/{userA_uid}/total/receivedFollowers = 1
```

---

#### 테스트 시나리오 5: 좋아요 취소 (-3점)

**테스트 단계**:
1. 사용자 B로 로그인
2. 이전에 좋아요한 게시글에서 좋아요 취소
3. 사용자 A의 프로필 페이지 확인 → 인플루언서 점수 -3점 확인

**예상 결과**:
```
/influencer-scores/{userA_uid} = 70 (73 - 3)
/user-stats/{userA_uid}/total/receivedLikes = 0
```

---

#### 테스트 시나리오 6: 게시글 삭제 페널티 (-55점)

**테스트 단계**:
1. 사용자 A로 로그인
2. 자신이 작성한 게시글 삭제
3. 사용자 A의 프로필 페이지 확인 → 인플루언서 점수 -55점 확인

**예상 결과**:
```
/influencer-scores/{userA_uid} = 15 (70 - 55)
점수 변화: -50 (게시글 생성 원복) + -5 (페널티)
```

---

## 4. Firebase Logs 모니터링 명령어

### 특정 함수 로그만 확인
```bash
cd firebase/functions
firebase functions:log --only onLikeCreatedStats,onLikeDeletedStats,onCommentCreateStats,onPostCreateStats
```

### 실시간 로그 스트리밍
```bash
firebase functions:log --follow
```

### 최근 100개 로그 확인
```bash
firebase functions:log --limit 100
```

---

## 5. 테스트 체크리스트

### 필수 테스트
- [ ] 게시글 좋아요 → 점수 +3점 확인
- [ ] 댓글 작성 → 점수 +10점 확인
- [ ] 팔로우 → 점수 +60점 확인
- [ ] 본인 좋아요 → 점수 변화 없음 확인
- [ ] 좋아요 취소 → 점수 -3점 확인
- [ ] 게시글 삭제 → 점수 -55점 확인 (페널티 포함)

### 통계 집계 확인
- [ ] `/user-stats/{uid}/total` 통계 업데이트 확인
- [ ] `/user-stats/{uid}/daily/{date}` 일간 통계 업데이트 확인
- [ ] `/influencer-rankings/total` 순위 업데이트 확인
- [ ] `/influencer-rankings/daily/{date}` 일간 순위 업데이트 확인

### UI 확인
- [ ] 사용자 프로필 페이지에서 인플루언서 점수 실시간 업데이트 확인
- [ ] 인플루언서 순위 페이지 (`/user/influencers`)에서 순위 반영 확인
- [ ] 숫자 포맷팅 (1,234 형식) 확인

### Firebase Functions Logs 확인
- [ ] 좋아요 생성/삭제 로그 확인
- [ ] 댓글 생성/삭제 로그 확인
- [ ] 게시글 생성/삭제 로그 확인
- [ ] 팔로우 생성/삭제 로그 확인
- [ ] 에러 로그 없음 확인

---

## 6. 추가 검증 사항

### 점수 계산 공식 검증
```typescript
influencerScore =
  (receivedLikes × 3) +
  (receivedComments × 10) +
  (receivedFollowers × 60) +
  증분 점수 (게시글 생성/삭제, 댓글 생성/삭제의 누적)
```

### 페널티 시스템 검증
- 게시글 생성: +50점
- 게시글 삭제: -55점 (원복 -50점 + 페널티 -5점)
- 댓글 생성: +8점
- 댓글 삭제: -10점 (원복 -8점 + 페널티 -2점)

---

## 7. 알려진 제한사항

1. **증분 점수 시스템**: 기존 통계 기반 점수와 증분 점수가 혼합되어 있어 단순 계산으로 검증하기 어려움
2. **본인 반응 제외**: 자기 자신에게 한 좋아요/댓글은 통계에 반영되지 않음
3. **Firebase Admin 인증**: 로컬 스크립트 실행 시 Service Account Key 필요

---

## 8. 다음 단계

1. ✅ 좋아요 통계 핸들러 수정 완료
2. ✅ Firebase Functions 배포 완료
3. ⏳ 실제 앱에서 통합 테스트 수행 (사용자가 직접 수행 필요)
4. ⏳ Firebase Console 및 Logs에서 결과 확인
5. ⏳ 발견된 이슈 수정 및 재배포
6. ⏳ 프로덕션 환경 검증 및 모니터링

---

## 9. 참고 문서

- [인플루언서 점수 테스트 가이드](/tmp/test-influencer-scoring.md)
- [리액션 통계 스펙 문서](/specs/sonub-reactions-stats.md)
- [인플루언서 점수 테스트 계획](/specs/sonub-influencer-score-testing.md)
