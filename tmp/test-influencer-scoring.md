# 인플루언서 점수 통합 테스트 가이드

## 1. 테스트 환경 준비

### Firebase Functions Logs 모니터링
터미널에서 다음 명령어를 실행하여 실시간 로그를 확인하세요:
```bash
cd firebase/functions
firebase functions:log --only onLikeCreatedStats,onLikeDeletedStats,onCommentCreateStats,onPostCreateStats,onUserFollowingCreateStats
```

또는 Firebase Console에서 확인:
https://console.firebase.google.com/project/sonub-firebase/functions/logs

---

## 2. 테스트 시나리오

### 테스트 사용자
- **사용자 A**: 게시글/댓글 작성자 (점수를 받을 사용자)
- **사용자 B**: 좋아요/댓글/팔로우를 할 사용자

---

## 3. 테스트 1: 게시글 좋아요 (+3점)

### 3.1. 테스트 수행
1. 사용자 A로 로그인하여 게시글 작성
2. 사용자 B로 로그인
3. 사용자 A가 작성한 게시글에 좋아요 클릭

### 3.2. 예상 결과
- 사용자 A의 인플루언서 점수가 **+3점** 증가
- Firebase RTDB 경로에서 확인:
  ```
  /influencer-scores/{userA_uid} = 3
  /user-stats/{userA_uid}/total/receivedLikes = 1
  /user-stats/{userA_uid}/daily/{yyyyMMdd}/receivedLikes = 1
  ```

### 3.3. 확인 방법
**Firebase Console에서 확인**:
1. Firebase Console → Realtime Database
2. 경로: `/influencer-scores/{userA_uid}` 확인
3. 경로: `/user-stats/{userA_uid}/total` 확인

**앱에서 확인**:
1. 사용자 A의 프로필 페이지 이동
2. 인플루언서 점수 표시 확인 (3점)

**Logs에서 확인**:
```
좋아요 생성 통계 트리거 { likerUid: 'userB_uid', targetId: 'post_id', targetType: 'post' }
좋아요 생성 통계 처리 시작
대상 작성자를 찾음: userA_uid
인플루언서 점수 증가: +3점
좋아요 생성 통계 처리 완료
```

---

## 4. 테스트 2: 댓글 작성 (+10점)

### 4.1. 테스트 수행
1. 사용자 A로 로그인하여 게시글 작성
2. 사용자 B로 로그인
3. 사용자 A의 게시글에 댓글 작성

### 4.2. 예상 결과
- 사용자 A의 인플루언서 점수가 **+10점** 증가
- Firebase RTDB 경로에서 확인:
  ```
  /influencer-scores/{userA_uid} = 13 (3 + 10)
  /user-stats/{userA_uid}/total/receivedComments = 1
  /user-stats/{userA_uid}/daily/{yyyyMMdd}/receivedComments = 1
  ```

---

## 5. 테스트 3: 팔로우 (+60점)

### 5.1. 테스트 수행
1. 사용자 B로 로그인
2. 사용자 A를 팔로우

### 5.2. 예상 결과
- 사용자 A의 인플루언서 점수가 **+60점** 증가
- Firebase RTDB 경로에서 확인:
  ```
  /influencer-scores/{userA_uid} = 73 (13 + 60)
  /user-stats/{userA_uid}/total/receivedFollowers = 1
  ```

---

## 6. 테스트 4: 본인 반응 제외 (점수 변화 없음)

### 6.1. 테스트 수행
1. 사용자 A로 로그인
2. 자신의 게시글에 좋아요 클릭

### 6.2. 예상 결과
- 사용자 A의 인플루언서 점수 **변화 없음** (여전히 73점)
- Logs에서 확인:
  ```
  자기 자신에게 한 좋아요는 통계에서 제외됩니다
  ```

---

## 7. 테스트 5: 좋아요 취소 (-3점)

### 7.1. 테스트 수행
1. 사용자 B로 로그인
2. 이전에 좋아요한 사용자 A의 게시글에서 좋아요 취소

### 7.2. 예상 결과
- 사용자 A의 인플루언서 점수가 **-3점** 감소
- Firebase RTDB 경로에서 확인:
  ```
  /influencer-scores/{userA_uid} = 70 (73 - 3)
  /user-stats/{userA_uid}/total/receivedLikes = 0
  ```

---

## 8. 테스트 6: 게시글 삭제 페널티 (-55점)

### 8.1. 테스트 수행
1. 사용자 A로 로그인
2. 자신이 작성한 게시글 삭제

### 8.2. 예상 결과
- 사용자 A의 인플루언서 점수가 **-55점** 감소 (-50점 원복 + -5점 페널티)
- Firebase RTDB 경로에서 확인:
  ```
  /influencer-scores/{userA_uid} = 15 (70 - 55)
  ```

---

## 9. Firebase Database 직접 확인 쿼리

### 특정 사용자의 인플루언서 점수 확인
```
경로: /influencer-scores/{uid}
```

### 특정 사용자의 전체 통계 확인
```
경로: /user-stats/{uid}/total
예상 데이터:
{
  "receivedLikes": 0,
  "receivedComments": 1,
  "receivedFollowers": 1,
  "createdPosts": 0
}
```

### 일간 Top 5 인플루언서 확인
```
경로: /influencer-rankings/daily/{yyyyMMdd}
예시: /influencer-rankings/daily/20250119
```

### 전체 Top 10 인플루언서 확인
```
경로: /influencer-rankings/total
(점수가 음수로 저장되어 있음: -15, -30, -50...)
```

---

## 10. 테스트 체크리스트

- [ ] 게시글 좋아요 → 점수 +3점 확인
- [ ] 댓글 작성 → 점수 +10점 확인
- [ ] 팔로우 → 점수 +60점 확인
- [ ] 본인 좋아요 → 점수 변화 없음 확인
- [ ] 좋아요 취소 → 점수 -3점 확인
- [ ] 게시글 삭제 → 점수 -55점 확인 (페널티 포함)
- [ ] Firebase Logs에서 정상 처리 로그 확인
- [ ] 사용자 프로필 페이지에서 점수 실시간 업데이트 확인
- [ ] 인플루언서 순위 페이지에서 순위 반영 확인

---

## 11. 문제 발생 시 확인 사항

### 점수가 증가하지 않는 경우
1. Firebase Functions Logs 확인 (에러 메시지 확인)
2. `/likes/{uid}/{targetId}` 경로에 데이터가 올바르게 저장되었는지 확인
3. 좋아요 데이터가 문자열로 저장되었는지 확인 (예: "post", "comment")
4. Cloud Functions가 제대로 배포되었는지 확인

### Logs에 에러가 있는 경우
```bash
# 특정 함수의 상세 로그 확인
firebase functions:log --only onLikeCreatedStats

# 모든 함수의 로그 확인
firebase functions:log
```

---

## 12. 테스트 완료 후

모든 테스트가 통과하면:
1. 테스트 결과를 `specs/sonub-influencer-score-testing.md`에 기록
2. 발견된 이슈가 있다면 수정 및 재배포
3. 프로덕션 환경에서 추가 검증
