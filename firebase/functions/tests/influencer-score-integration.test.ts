/**
 * 인플루언서 점수 시스템 통합 테스트
 *
 * 이 테스트는 다음을 검증합니다:
 * 1. 좋아요 생성/삭제 시 점수 변화
 * 2. 댓글 생성/삭제 시 점수 변화
 * 3. 팔로우/언팔로우 시 점수 변화
 * 4. 게시글 생성/삭제 시 점수 변화
 * 5. 본인 반응 제외 로직
 *
 * 테스트 환경:
 * - Firebase Admin SDK 사용
 * - Service Account Key 인증
 * - Realtime Database 직접 접근
 */

import {describe, it, expect, beforeAll, afterAll, beforeEach} from "vitest";
import * as admin from "firebase-admin";
import * as path from "path";

// Service Account Key 경로 (functions 폴더에 위치)
const serviceAccountPath = path.join(__dirname, "..", "firebase-service-account-key.json");

// Firebase Admin 초기화
let app: admin.app.App;
let database: admin.database.Database;

// 테스트용 UID
const testUserA = "test-user-a-" + Date.now();
const testUserB = "test-user-b-" + Date.now();
const testPostId = "test-post-" + Date.now();
const testCommentId = "test-comment-" + Date.now();

/**
 * 테스트 시작 전 초기화
 */
beforeAll(async () => {
  try {
    // Service Account Key 파일 존재 확인
    const fs = await import("fs");
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service Account Key 파일이 없습니다: ${serviceAccountPath}`);
    }

    // Firebase Admin 초기화
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      databaseURL: "https://sonub-firebase-default-rtdb.asia-southeast1.firebasedatabase.app",
    });

    database = admin.database();

    console.log("✅ Firebase Admin 초기화 완료");

    // 🔥 이전 테스트의 모든 잔여 데이터 정리
    console.log("🧹 이전 테스트 데이터 정리 중...");

    // UTC 날짜 계산
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const monthKey = `${year}-${month}`;
    const yearKey = `${year}`;

    // 모든 테스트 사용자 UID 수집
    const testUserIds: string[] = [];

    // 인플루언서 점수에서 'test-' 로 시작하는 모든 UID 찾기
    const scoresSnapshot = await database.ref("influencer-scores").once("value");
    if (scoresSnapshot.exists()) {
      scoresSnapshot.forEach((child) => {
        const uid = child.key;
        if (uid && uid.startsWith("test-")) {
          testUserIds.push(uid);
        }
      });
    }

    // 모든 랭킹에서 'test-' 로 시작하는 UID 찾기
    const rankingPaths = [
      `influencer-rankings/daily/${dateKey}`,
      `influencer-rankings/monthly/${monthKey}`,
      `influencer-rankings/yearly/${yearKey}`,
      "influencer-rankings/total",
    ];

    for (const path of rankingPaths) {
      const snapshot = await database.ref(path).once("value");
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const uid = child.key;
          if (uid && uid.startsWith("test-") && !testUserIds.includes(uid)) {
            testUserIds.push(uid);
          }
        });
      }
    }

    console.log(`🗑️  삭제할 테스트 사용자: ${testUserIds.length}개`);

    // 모든 테스트 사용자 데이터 삭제
    const deletions: Promise<void>[] = [];
    for (const uid of testUserIds) {
      deletions.push(
        database.ref(`influencer-scores/${uid}`).remove(),
        database.ref(`user-stats/${uid}`).remove(),
        database.ref(`influencer-rankings/daily/${dateKey}/${uid}`).remove(),
        database.ref(`influencer-rankings/monthly/${monthKey}/${uid}`).remove(),
        database.ref(`influencer-rankings/yearly/${yearKey}/${uid}`).remove(),
        database.ref(`influencer-rankings/total/${uid}`).remove()
      );
    }

    await Promise.all(deletions);
    console.log("✅ 이전 테스트 데이터 정리 완료");
  } catch (error) {
    console.error("❌ Firebase Admin 초기화 실패:", error);
    throw error;
  }
});

/**
 * 각 테스트 전 데이터 정리
 */
beforeEach(async () => {
  // UTC 날짜 계산 (랭킹 데이터 정리용)
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;
  const monthKey = `${year}-${month}`;
  const yearKey = `${year}`;

  // 🔥 테스트 데이터 초기화: 2단계로 진행
  // 1단계: 게시글, 댓글, 좋아요, 팔로우 등 먼저 삭제
  //        (이들이 삭제될 때 Cloud Functions가 트리거되어 점수를 변경할 수 있음)
  await Promise.all([
    // 게시글 및 댓글
    database.ref(`posts/${testPostId}`).remove(),
    database.ref(`comments/${testPostId}/${testCommentId}`).remove(),
    // 좋아요
    database.ref(`likes/${testUserA}/${testPostId}`).remove(),
    database.ref(`likes/${testUserB}/${testPostId}`).remove(),
    database.ref(`likes-by/${testPostId}/${testUserA}`).remove(),
    database.ref(`likes-by/${testPostId}/${testUserB}`).remove(),
    // 팔로우
    database.ref(`user-following/${testUserA}/${testUserB}`).remove(),
    database.ref(`user-following/${testUserB}/${testUserA}`).remove(),
    database.ref(`user-followers/${testUserA}/${testUserB}`).remove(),
    database.ref(`user-followers/${testUserB}/${testUserA}`).remove(),
  ]);

  // Cloud Functions가 실행될 시간 확보 (3초 대기)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 2단계: Cloud Functions 처리 완료 후 점수, 통계, 랭킹 삭제
  await Promise.all([
    // 인플루언서 점수 및 랭킹
    database.ref(`influencer-scores/${testUserA}`).remove(),
    database.ref(`influencer-scores/${testUserB}`).remove(),
    database.ref(`influencer-rankings/daily/${dateKey}/${testUserA}`).remove(),
    database.ref(`influencer-rankings/daily/${dateKey}/${testUserB}`).remove(),
    database.ref(`influencer-rankings/monthly/${monthKey}/${testUserA}`).remove(),
    database.ref(`influencer-rankings/monthly/${monthKey}/${testUserB}`).remove(),
    database.ref(`influencer-rankings/yearly/${yearKey}/${testUserA}`).remove(),
    database.ref(`influencer-rankings/yearly/${yearKey}/${testUserB}`).remove(),
    database.ref(`influencer-rankings/total/${testUserA}`).remove(),
    database.ref(`influencer-rankings/total/${testUserB}`).remove(),
    // 사용자 통계
    database.ref(`user-stats/${testUserA}`).remove(),
    database.ref(`user-stats/${testUserB}`).remove(),
  ]);
});

/**
 * 테스트 종료 후 정리
 */
afterAll(async () => {
  // UTC 날짜 계산
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;
  const monthKey = `${year}-${month}`;
  const yearKey = `${year}`;

  // 테스트 데이터 정리 (점수, 통계, 랭킹 모두 포함)
  await Promise.all([
    // 인플루언서 점수 및 랭킹
    database.ref(`influencer-scores/${testUserA}`).remove(),
    database.ref(`influencer-scores/${testUserB}`).remove(),
    database.ref(`influencer-rankings/daily/${dateKey}/${testUserA}`).remove(),
    database.ref(`influencer-rankings/daily/${dateKey}/${testUserB}`).remove(),
    database.ref(`influencer-rankings/monthly/${monthKey}/${testUserA}`).remove(),
    database.ref(`influencer-rankings/monthly/${monthKey}/${testUserB}`).remove(),
    database.ref(`influencer-rankings/yearly/${yearKey}/${testUserA}`).remove(),
    database.ref(`influencer-rankings/yearly/${yearKey}/${testUserB}`).remove(),
    database.ref(`influencer-rankings/total/${testUserA}`).remove(),
    database.ref(`influencer-rankings/total/${testUserB}`).remove(),
    // 사용자 통계
    database.ref(`user-stats/${testUserA}`).remove(),
    database.ref(`user-stats/${testUserB}`).remove(),
    // 게시글 및 댓글
    database.ref(`posts/${testPostId}`).remove(),
    database.ref(`comments/${testPostId}/${testCommentId}`).remove(),
    // 좋아요
    database.ref(`likes/${testUserA}/${testPostId}`).remove(),
    database.ref(`likes/${testUserB}/${testPostId}`).remove(),
    database.ref(`likes-by/${testPostId}/${testUserA}`).remove(),
    database.ref(`likes-by/${testPostId}/${testUserB}`).remove(),
    // 팔로우
    database.ref(`user-following/${testUserA}/${testUserB}`).remove(),
    database.ref(`user-following/${testUserB}/${testUserA}`).remove(),
    database.ref(`user-followers/${testUserA}/${testUserB}`).remove(),
    database.ref(`user-followers/${testUserB}/${testUserA}`).remove(),
  ]);

  // Firebase Admin 종료
  await app.delete();
  console.log("✅ Firebase Admin 종료 완료");
});

describe("인플루언서 점수 시스템 통합 테스트", () => {
  describe("게시글 좋아요 기능", () => {
    it("게시글에 좋아요를 하면 작성자의 인플루언서 점수가 +3점 증가한다", async () => {
      // 1. 게시글 생성 (User A가 작성)
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post",
        category: "discussion",
        createdAt: Date.now(),
      });

      // 대기: Cloud Functions가 통계를 업데이트할 시간 확보
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 초기 점수 확인
      const initialScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
      console.log(`초기 점수: ${initialScore}`);

      // 2. User B가 User A의 게시글에 좋아요
      await database.ref(`likes/${testUserB}/${testPostId}`).set("post");

      // 대기: Cloud Functions가 통계를 업데이트할 시간 확보
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. User A의 인플루언서 점수 확인
      const finalScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
      console.log(`최종 점수: ${finalScore}`);

      // 4. 검증: 점수가 +3점 증가했는지 확인
      expect(finalScore).toBe(initialScore + 3);
    }, 15000);

    it("자기 자신의 게시글에 좋아요를 해도 점수가 증가하지 않는다", async () => {
      // 1. 게시글 생성 (User A가 작성)
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post",
        category: "discussion",
        createdAt: Date.now(),
      });

      // 대기
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const initialScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 2. User A가 자신의 게시글에 좋아요 (본인 반응)
      await database.ref(`likes/${testUserA}/${testPostId}`).set("post");

      // 대기
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. User A의 인플루언서 점수 확인
      const finalScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 4. 검증: 점수가 변하지 않았는지 확인
      expect(finalScore).toBe(initialScore);
    }, 15000);

    it("좋아요를 취소하면 작성자의 인플루언서 점수가 -3점 감소한다", async () => {
      // 1. 게시글 생성 및 좋아요
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post",
        category: "discussion",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await database.ref(`likes/${testUserB}/${testPostId}`).set("post");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const scoreAfterLike = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 2. 좋아요 취소
      await database.ref(`likes/${testUserB}/${testPostId}`).remove();

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. User A의 인플루언서 점수 확인
      const finalScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 4. 검증: 점수가 -3점 감소했는지 확인
      expect(finalScore).toBe(scoreAfterLike - 3);
    }, 20000);
  });

  describe("팔로우 기능", () => {
    it("팔로우를 받으면 인플루언서 점수가 +60점 증가한다", async () => {
      // 초기 점수
      const initialScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // User B가 User A를 팔로우
      // user-following 경로만 쓰면 Cloud Functions가 user-followers를 자동 생성
      await database.ref(`user-following/${testUserB}/${testUserA}`).set(true);

      // 대기: Cloud Functions가 처리할 시간 확보
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 점수 확인
      const finalScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 검증: +60점 증가
      expect(finalScore).toBe(initialScore + 60);
    }, 10000);

    it("언팔로우를 당하면 인플루언서 점수가 -60점 감소한다", async () => {
      // 1. 팔로우
      // user-following 경로만 쓰면 Cloud Functions가 user-followers를 자동 생성
      await database.ref(`user-following/${testUserB}/${testUserA}`).set(true);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const scoreAfterFollow = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 2. 언팔로우
      // user-following 경로만 삭제하면 Cloud Functions가 user-followers를 자동 삭제
      await database.ref(`user-following/${testUserB}/${testUserA}`).remove();

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. 점수 확인
      const finalScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 검증: -60점 감소
      expect(finalScore).toBe(scoreAfterFollow - 60);
    }, 15000);
  });

  describe("댓글 기능", () => {
    it("게시글에 댓글을 작성하면 댓글 작성자는 +5점, 게시글 작성자는 +5점 증가한다", async () => {
      // 1. 게시글 생성 (User A가 작성)
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post",
        category: "discussion",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 초기 점수
      const initialScoreA = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
      const initialScoreB = (await database.ref(`influencer-scores/${testUserB}`).get()).val() || 0;

      console.log(`User A 초기 점수: ${initialScoreA}, User B 초기 점수: ${initialScoreB}`);

      // 2. User B가 User A의 게시글에 댓글 작성
      await database.ref(`comments/${testPostId}/${testCommentId}`).set({
        authorUid: testUserB,
        text: "Test Comment",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. 점수 확인
      const finalScoreA = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
      const finalScoreB = (await database.ref(`influencer-scores/${testUserB}`).get()).val() || 0;

      console.log(`User A 최종 점수: ${finalScoreA}, User B 최종 점수: ${finalScoreB}`);

      // 4. 검증
      expect(finalScoreB).toBe(initialScoreB + 5); // 댓글 작성자 +5점
      expect(finalScoreA).toBe(initialScoreA + 5); // 게시글 작성자 +5점 (RECEIVED)
    }, 20000);

    it("자기 자신의 게시글에 댓글을 작성하면 작성자는 +5점, 수신자는 0점이다", async () => {
      // 1. 게시글 생성 (User A가 작성)
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post",
        category: "discussion",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const initialScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 2. User A가 자신의 게시글에 댓글 작성
      await database.ref(`comments/${testPostId}/${testCommentId}`).set({
        authorUid: testUserA,
        text: "Test Comment",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. 점수 확인
      const finalScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

      // 4. 검증: 작성자는 +5점만 (RECEIVED는 본인이므로 0점)
      expect(finalScore).toBe(initialScore + 5);
    }, 20000);

    it("댓글을 삭제하면 댓글 작성자는 -5점, 게시글 작성자는 -5점 감소한다", async () => {
      // 1. 게시글 생성 및 댓글 작성
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post",
        category: "discussion",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await database.ref(`comments/${testPostId}/${testCommentId}`).set({
        authorUid: testUserB,
        text: "Test Comment",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const scoreAfterCommentA = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
      const scoreAfterCommentB = (await database.ref(`influencer-scores/${testUserB}`).get()).val() || 0;

      // 2. 댓글 삭제
      await database.ref(`comments/${testPostId}/${testCommentId}`).remove();

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. 점수 확인
      const finalScoreA = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
      const finalScoreB = (await database.ref(`influencer-scores/${testUserB}`).get()).val() || 0;

      // 4. 검증
      expect(finalScoreB).toBe(scoreAfterCommentB - 5); // 댓글 작성자 -5점
      expect(finalScoreA).toBe(scoreAfterCommentA - 5); // 게시글 작성자 -5점
    }, 25000);
  });

  describe("통계 집계 확인", () => {
    it("좋아요 받은 통계가 올바르게 집계된다", async () => {
      // 게시글 생성
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post",
        category: "discussion",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 게시글 확인
      const post = (await database.ref(`posts/${testPostId}`).get()).val();
      console.log(`게시글 데이터:`, post);

      // 좋아요 전 점수 확인
      const scoreBefore = (await database.ref(`influencer-scores/${testUserA}`).get()).val();
      console.log(`좋아요 전 점수: ${scoreBefore}`);

      // 좋아요
      await database.ref(`likes/${testUserB}/${testPostId}`).set("post");

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 좋아요 확인
      const like = (await database.ref(`likes/${testUserB}/${testPostId}`).get()).val();
      console.log(`좋아요 데이터: ${like}`);

      // 좋아요 후 점수 확인
      const scoreAfter = (await database.ref(`influencer-scores/${testUserA}`).get()).val();
      console.log(`좋아요 후 점수: ${scoreAfter}`);

      // 통계 확인
      const receivedLikes = (await database.ref(`user-stats/${testUserA}/total/receivedLikes`).get()).val();
      const daily = (await database.ref(`user-stats/${testUserA}/daily`).get()).val();
      const monthly = (await database.ref(`user-stats/${testUserA}/monthly`).get()).val();
      console.log(`receivedLikes: ${receivedLikes}, daily: ${JSON.stringify(daily)}, monthly: ${JSON.stringify(monthly)}`);

      // 검증: receivedLikes가 1이어야 함
      expect(receivedLikes).toBe(1);
    }, 20000);
  });

  describe("인플루언서 랭킹 데이터 집계", () => {
    it("인플루언서 점수가 변경되면 일간/월간/연간 랭킹에 자동으로 반영된다", async () => {
      // 1. 게시글 생성 (User A가 작성) - 50점 받아야 함
      const postCreatedAt = Date.now();
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post for Ranking",
        category: "discussion",
        createdAt: postCreatedAt,
      });

      console.log(`게시글 생성 요청: postId=${testPostId}, authorUid=${testUserA}, createdAt=${postCreatedAt}`);

      // 게시글이 실제로 생성되었는지 확인
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const postSnapshot1 = (await database.ref(`posts/${testPostId}`).get()).val();
      console.log(`게시글 확인 (1초 후):`, postSnapshot1);

      // onPostCreate 실행 대기 (3초 추가)
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const postSnapshot2 = (await database.ref(`posts/${testPostId}`).get()).val();
      console.log(`게시글 확인 (4초 후):`, postSnapshot2);

      // 게시글 생성 후 점수 확인 (10초 추가 대기 - onPostCreateStats 처리 시간)
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const scoreAfterPost = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
      console.log(`게시글 생성 후 점수 (14초 후): ${scoreAfterPost}`);

      // 2. User B가 좋아요 - +3점
      await database.ref(`likes/${testUserB}/${testPostId}`).set("post");

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 3. User A의 인플루언서 점수 확인
      const score = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
      console.log(`최종 점수: ${score}`);
      expect(score).toBeGreaterThan(0);

      // 4. UTC 날짜 계산 (핸들러와 동일한 형식)
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, "0");
      const day = String(now.getUTCDate()).padStart(2, "0");

      const dateKey = `${year}${month}${day}`; // 일간 (yyyyMMdd)
      const monthKey = `${year}${month}`; // 월간 (yyyyMM)
      const yearKey = `${year}`; // 연간 (yyyy)

      // 5. 랭킹 데이터 확인 (음수로 저장됨, 내림차순 정렬용)
      const dailyRanking = (await database.ref(`influencer-rankings/daily/${dateKey}/${testUserA}`).get()).val();
      const monthlyRanking = (await database.ref(`influencer-rankings/monthly/${monthKey}/${testUserA}`).get()).val();
      const yearlyRanking = (await database.ref(`influencer-rankings/yearly/${yearKey}/${testUserA}`).get()).val();
      const totalRanking = (await database.ref(`influencer-rankings/total/${testUserA}`).get()).val();

      console.log(`점수: ${score}, 일간: ${dailyRanking}, 월간: ${monthlyRanking}, 연간: ${yearlyRanking}, 전체: ${totalRanking}`);

      // 6. 검증: 모든 랭킹에 음수 점수가 기록되어야 함 (내림차순 정렬용)
      expect(dailyRanking).toBe(-score);
      expect(monthlyRanking).toBe(-score);
      expect(yearlyRanking).toBe(-score);
      expect(totalRanking).toBe(-score);
    }, 35000);

    it("여러 사용자의 점수가 올바른 순서로 정렬된다", async () => {
      // 1. User A 게시글 생성 (50점)
      await database.ref(`posts/${testPostId}`).set({
        authorUid: testUserA,
        text: "Test Post A",
        category: "discussion",
        createdAt: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 2. User B가 User A 팔로우 (60점)
      await database.ref(`user-following/${testUserB}/${testUserA}`).set(true);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. User A의 점수 확인 (50 + 60 = 110점 이상)
      const scoreA = (await database.ref(`influencer-scores/${testUserA}`).get()).val();
      const scoreB = (await database.ref(`influencer-scores/${testUserB}`).get()).val() || 0;

      console.log(`User A 점수: ${scoreA}, User B 점수: ${scoreB}`);

      // 4. 검증: User A 점수가 User B보다 높아야 함
      expect(scoreA).toBeGreaterThan(scoreB);

      // 5. 랭킹 데이터 조회
      const totalRankings = (await database.ref("influencer-rankings/total").get()).val();

      if (totalRankings) {
        const sortedUsers = Object.entries(totalRankings)
          .sort(([, a], [, b]) => (b as number) - (a as number));

        console.log("전체 랭킹:", sortedUsers);

        // User A가 상위에 있는지 확인
        const userAIndex = sortedUsers.findIndex(([uid]) => uid === testUserA);
        const userBIndex = sortedUsers.findIndex(([uid]) => uid === testUserB);

        if (userAIndex !== -1 && userBIndex !== -1) {
          expect(userAIndex).toBeLessThan(userBIndex);
        }
      }
    }, 25000);
  });
});
