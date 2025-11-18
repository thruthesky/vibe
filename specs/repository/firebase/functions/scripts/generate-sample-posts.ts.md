---
title: generate-sample-posts.ts
type: typescript
path: firebase/functions/scripts/generate-sample-posts.ts
status: active
version: 1.0.0
last_updated: 2025-11-15
---

## 개요

이 파일은 `firebase/functions/scripts/generate-sample-posts.ts`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 소스 코드

```typescript
/**
 * 샘플 게시글 생성 스크립트
 *
 * Firebase Realtime Database에 community 카테고리 100개 글을 생성합니다.
 *
 * 사용 방법:
 * 1. firebase/functions 폴더에서 실행: npx ts-node scripts/generate-sample-posts.ts
 * 2. 또는 build 후 실행: node lib/scripts/generate-sample-posts.js
 *
 * ⚠️ 주의사항:
 * - 이 스크립트는 한 번만 실행하는 것을 권장합니다 (중복 데이터 방지)
 * - 기존 데이터를 덮어쓰지 않습니다 (새로운 postId로 생성)
 * - Google Cloud 자격증명이 필요합니다 (GOOGLE_APPLICATION_CREDENTIALS 환경변수)
 */

import * as admin from "firebase-admin";

// ========================================================================
// Firebase Admin 초기화
// ========================================================================

/**
 * Firebase Admin을 초기화합니다.
 *
 * 자격증명 방식:
 * 1. 환경변수 GOOGLE_APPLICATION_CREDENTIALS가 설정된 경우: JSON 파일 경로 사용
 * 2. 환경변수가 없는 경우: Default Application Credentials (DAC) 사용
 * 3. 로컬 개발: Firebase Emulator 또는 Service Account 키 파일 사용
 */
function initializeFirebase() {
  // 자격증명 경로 확인
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // console.log("🔧 Firebase Admin 초기화 중...");
  // console.log(
    // `📍 Credentials: ${credentialsPath || "Default Application Credentials"}`
  // );

  if (!admin.apps.length) {
    admin.initializeApp({
      databaseURL:
        process.env.FIREBASE_RTDB_URL ||
        "https://sns-project-45b96-default-rtdb.asia-southeast1." +
          "firebasedatabase.app",
    });
  }

  // console.log("✅ Firebase Admin 초기화 완료\n");
}

// ========================================================================
// 샘플 데이터 생성 함수
// ========================================================================

/**
 * 사용자 UID를 생성합니다 (테스트용).
 * 실제 테스트 계정의 UID를 사용하거나, 샘플 UID를 생성할 수 있습니다.
 *
 * @param {number} index - 사용자 인덱스
 * @returns {string} 테스트 사용자 UID
 */
function generateTestUserId(index: number): string {
  // 테스트용 UID 패턴: test-user-1, test-user-2, ...
  // 또는 실제 Firebase Auth의 UID를 사용할 수 있습니다
  return `test-user-${(index % 5) + 1}`; // 5명의 테스트 사용자 순환
}

/**
 * 게시글 제목을 생성합니다.
 *
 * @param {number} index - 게시글 인덱스
 * @returns {string} 게시글 제목
 */
function generatePostTitle(index: number): string {
  const titles = [
    "안녕하세요",
    "좋은 정보 공유",
    "질문이 있습니다",
    "경험담 나눔",
    "추천할 만한 장소",
    "도움 요청",
    "새로운 소식",
    "의견 공유",
    "팁과 노하우",
    "이벤트 소식",
  ];

  const title = titles[index % titles.length];

  return `${title} ${index + 1}`;
}

/**
 * 게시글 내용을 생성합니다.
 *
 * @param {number} index - 게시글 인덱스
 * @returns {string} 게시글 내용
 */
function generatePostContent(index: number): string {
  const contents = [
    "이것은 샘플 게시글입니다. " +
      "커뮤니티에서 모든 사람과 함께 소통해봅시다.",
    "여러분의 의견을 듣고 싶습니다. 댓글로 피드백을 남겨주세요.",
    "이번 주 새로운 소식입니다. 더 많은 정보는 댓글을 참고해주세요.",
    "좋은 하루 되세요! 이 글이 도움이 되길 바랍니다.",
    "커뮤니티 멤버분들과 즐거운 대화를 나누고 싶습니다.",
  ];

  const content = contents[index % contents.length];
  return (
    `${content}\n\n글 번호: ${index + 1}\n` +
    `생성 시간: ${new Date().toLocaleString("ko-KR")}`
  );
}

/**
 * 게시글 작성자명을 생성합니다.
 *
 * @param {number} index - 작성자 인덱스
 * @returns {string} 작성자 이름
 */
function generateAuthorName(index: number): string {
  const names = [
    "테스트 사용자 1",
    "테스트 사용자 2",
    "테스트 사용자 3",
    "테스트 사용자 4",
    "테스트 사용자 5",
  ];
  return names[index % names.length];
}

/**
 * 단일 게시글 데이터를 생성합니다.
 *
 * 구조는 sns-web-database.md에 정의된 포맷을 따릅니다:
 * - uid: 작성자 UID
 * - title: 게시글 제목
 * - content: 게시글 내용
 * - author: 작성자 displayName
 * - category: 게시판 카테고리 (community, qna, news, market)
 * - order: 정렬용 필드 (category-timestamp 형식)
 * - createdAt: 생성 시간 (Unix timestamp, 밀리초)
 * - updatedAt: 수정 시간 (Unix timestamp, 밀리초)
 * - likeCount: 좋아요 개수 (Cloud Functions가 관리하므로 0으로 초기화)
 * - commentCount: 댓글 개수 (Cloud Functions가 관리하므로 0으로 초기화)
 *
 * @param {number} index - 게시글 인덱스
 * @returns {object} 게시글 데이터 객체
 */
function generatePost(index: number): {
  uid: string;
  title: string;
  content: string;
  author: string;
  category: string;
  order: string;
  createdAt: number;
  updatedAt: number;
  likeCount: number;
  commentCount: number;
} {
  const now = Date.now();

  // 글을 역순으로 생성하여 최신 글이 먼저 보이도록 함
  // (order 필드의 timestamp를 감소시킴)
  // 각 글마다 1분씩 전에 생성된 것으로 설정
  const createdAtTime = now - (index * 60000);

  return {
    uid: generateTestUserId(index),
    title: generatePostTitle(index),
    content: generatePostContent(index),
    author: generateAuthorName(index),
    category: "community", // community, qna, news, market 중 선택
    order: `community-${createdAtTime}`, // 정렬용: category-timestamp
    createdAt: createdAtTime,
    updatedAt: createdAtTime,
    likeCount: 0, // Cloud Functions에 의해 관리됨
    commentCount: 0, // Cloud Functions에 의해 관리됨
  };
}

// ========================================================================
// 데이터베이스 쓰기 함수
// ========================================================================

/**
 * Firebase Realtime Database에 100개의 샘플 글을 생성합니다.
 *
 * 동작:
 * 1. /posts 경로에 새로운 postId를 자동으로 생성 (push())
 * 2. 각 글마다 위에서 정의한 필드를 포함
 * 3. 진행 상황을 콘솔에 출력
 * 4. 완료 후 생성된 글 개수와 소요 시간 표시
 *
 * ⚠️ 주의사항:
 * - 데이터베이스 쓰기 비용이 발생합니다 (100회의 쓰기 작업)
 * - 실행 중 네트워크 오류가 발생할 수 있습니다
 * - 대규모 배치 작업이므로 진행 상황을 확인하고 기다려야 합니다
 */
async function generateSamplePosts() {
  const db = admin.database();
  const postsRef = db.ref("/posts");

  const totalPosts = 100; // 생성할 글 개수
  const batchSize = 10; // 한 번에 10개씩 처리 (메모리 효율성)

  // console.log(`📝 Community 카테고리 ${totalPosts}개 글 생성 시작...\n`);

  const startTime = Date.now();
  let createdCount = 0;
  const errors: {index: number; error: string}[] = [];

  try {
    // 배치 단위로 처리
    for (let batch = 0; batch < Math.ceil(totalPosts / batchSize); batch++) {
      const startIndex = batch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalPosts);

      // 배치의 모든 글을 병렬로 생성
      const promises = [];

      for (let i = startIndex; i < endIndex; i++) {
        const postData = generatePost(i);

        // push()로 새로운 postId를 자동 생성하고 데이터 저장
        const promise = postsRef
          .push(postData)
          .then((ref) => {
            // console.log(
              // `✅ [${i + 1}/${totalPosts}] 글 생성 완료: ${ref.key}`
            // );
            createdCount++;
            return {success: true, postId: ref.key};
          })
          .catch((error) => {
            console.error(
              `❌ [${i + 1}/${totalPosts}] 글 생성 실패: ${error.message}`
            );
            errors.push({index: i + 1, error: error.message});
            return {success: false, index: i + 1};
          });

        promises.push(promise);
      }

      // 배치의 모든 작업이 완료될 때까지 대기
      await Promise.all(promises);

      // 진행 상황 출력
      const progress = Math.min(endIndex, totalPosts);
      const progressPercent = Math.round((progress / totalPosts) * 100);
      // console.log(
        // `\n📊 진행 상황: ${progress}/${totalPosts} (${progressPercent}%)\n`
      // );
    }

    // 완료 결과 출력
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // console.log("\n" + "=".repeat(60));
    // console.log("✅ 글 생성 완료!");
    // console.log("=".repeat(60));
    // console.log(`📊 생성된 글 수: ${createdCount}/${totalPosts}`);
    // console.log(`⏱️  소요 시간: ${elapsedTime}초`);

    if (errors.length > 0) {
      // console.log(`⚠️  오류 발생 수: ${errors.length}`);
      errors.forEach(({index, error}) => {
        // console.log(`   - [${index}] ${error}`);
      });
    }

    // console.log("=".repeat(60));
    // console.log("\n🎉 샘플 글 생성이 완료되었습니다!");
    // console.log("   Firebase Console에서 확인하거나");
    // console.log("   웹 애플리케이션의 게시판 페이지에서 확인할 수 있습니다.\n");

    return {
      success: errors.length === 0,
      createdCount,
      totalPosts,
      errors,
    };
  } catch (error) {
    console.error("\n❌ 치명적 오류:", error);
    throw error;
  }
}

// ========================================================================
// 메인 실행 함수
// ========================================================================

/**
 * 스크립트의 메인 실행 함수
 */
async function main() {
  try {
    // Firebase Admin 초기화
    initializeFirebase();

    // 샘플 글 생성
    const result = await generateSamplePosts();

    // 프로세스 종료
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("\n💥 예상치 못한 오류 발생:", error);
    process.exit(1);
  }
}

// 스크립트 실행 시작
main();

```

