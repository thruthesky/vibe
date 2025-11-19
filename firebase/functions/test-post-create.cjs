/**
 * 게시글 생성 테스트 스크립트
 *
 * 이 스크립트는 여러 카테고리에 게시글을 생성하여
 * categoryOrder와 allCategoryOrder가 올바르게 동작하는지 테스트합니다.
 *
 * 실행 방법:
 * cd firebase/functions
 * node ../../tmp/test-post-create.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin 초기화
const serviceAccount = require(path.join(__dirname, './firebase-service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://withcenter-test-4-default-rtdb.firebaseio.com'
});

const db = admin.database();

// 테스트 카테고리 목록
const categories = ['qna', 'discussion', 'free', 'buyandsell', 'news'];

// 테스트 사용자 UID (실제 존재하는 사용자 UID 사용)
const TEST_USER_UID = 'UOejC9wlWXeYKBgW3tjCCTZZy8j1'; // 실제 사용자 UID로 변경 필요

/**
 * 랜덤 게시글 제목 생성
 */
function getRandomTitle(category) {
  const titles = {
    qna: [
      'Firebase Cloud Functions 질문입니다',
      'Svelte 5에서 상태 관리는 어떻게 하나요?',
      'RTDB 보안 규칙 질문',
      'TypeScript 타입 오류 해결 방법',
      'Git 커밋 메시지 작성 팁'
    ],
    discussion: [
      '최신 웹 개발 트렌드 토론',
      'AI 코딩 도구의 미래',
      '오픈소스 프로젝트 참여 경험',
      'TDD vs BDD 어떤게 나을까요?',
      '클린 코드 작성 방법론'
    ],
    free: [
      '오늘 점심 뭐 먹을까요?',
      '취미로 코딩 배우시는 분들',
      '개발자 건강 관리 팁',
      '추천할 만한 기술 서적',
      '커피 vs 차, 여러분의 선택은?'
    ],
    buyandsell: [
      'M1 맥북 에어 판매합니다',
      '키보드 구매합니다 (기계식)',
      '중고 모니터 싸게 팔아요',
      '개발 서적 교환하실 분',
      'IDE 라이센스 공동 구매'
    ],
    news: [
      '새로운 ECMAScript 사양 발표',
      'React 19 베타 출시',
      'TypeScript 5.3 주요 기능',
      'Svelte 5 정식 릴리즈',
      'Node.js 보안 업데이트'
    ]
  };

  const categoryTitles = titles[category] || titles.free;
  return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
}

/**
 * 랜덤 게시글 내용 생성
 */
function getRandomContent() {
  const contents = [
    '이 주제에 대해 여러분의 의견을 듣고 싶습니다.',
    '최근에 경험한 내용을 공유합니다.',
    '도움이 필요합니다. 조언 부탁드립니다.',
    '유용한 정보를 발견해서 공유합니다.',
    '이 방법이 도움이 되었으면 좋겠습니다.'
  ];
  return contents[Math.floor(Math.random() * contents.length)];
}

/**
 * 게시글 생성
 */
async function createPost(category, delayMs = 0) {
  // 시간차를 두기 위한 지연
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  const now = Date.now();
  const postId = db.ref('posts').push().key;

  const postData = {
    authorUid: TEST_USER_UID,
    category: category,
    title: getRandomTitle(category),
    text: getRandomContent(),
    createdAt: now,
    updatedAt: now,
    // categoryOrder와 allCategoryOrder는 Cloud Functions에서 자동 생성됨
  };

  console.log(`\n📝 게시글 생성 중...`);
  console.log(`  - postId: ${postId}`);
  console.log(`  - category: ${category}`);
  console.log(`  - title: ${postData.title}`);
  console.log(`  - createdAt: ${now}`);

  await db.ref(`posts/${postId}`).set(postData);

  // Cloud Functions가 처리할 시간을 주기 위해 잠시 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 생성된 게시글 데이터 확인
  const snapshot = await db.ref(`posts/${postId}`).once('value');
  const updatedPost = snapshot.val();

  console.log(`\n✅ 게시글 생성 완료`);
  console.log(`  - categoryOrder: ${updatedPost.categoryOrder}`);
  console.log(`  - allCategoryOrder: ${updatedPost.allCategoryOrder}`);

  return { postId, postData, updatedPost };
}

/**
 * 모든 카테고리에 게시글 생성
 */
async function createTestPosts() {
  console.log('========================================');
  console.log('게시글 생성 테스트 시작');
  console.log('========================================\n');

  const results = [];

  // 각 카테고리별로 2개씩 게시글 생성 (시간차 두어서)
  for (let i = 0; i < 2; i++) {
    for (const category of categories) {
      const result = await createPost(category, 500); // 500ms 지연
      results.push(result);
    }
  }

  console.log('\n========================================');
  console.log('생성된 게시글 요약');
  console.log('========================================\n');

  // 카테고리별 그룹화
  const grouped = {};
  results.forEach(({ updatedPost }) => {
    const cat = updatedPost.category;
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push(updatedPost);
  });

  // 카테고리별 출력
  for (const [category, posts] of Object.entries(grouped)) {
    console.log(`\n📂 카테고리: ${category}`);
    console.log('게시글 목록 (categoryOrder 기준 정렬):');

    // categoryOrder 기준으로 정렬 (문자열 사전순)
    posts.sort((a, b) => {
      if (a.categoryOrder < b.categoryOrder) return -1;
      if (a.categoryOrder > b.categoryOrder) return 1;
      return 0;
    });

    posts.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.title}`);
      console.log(`     categoryOrder: ${post.categoryOrder}`);
      console.log(`     allCategoryOrder: ${post.allCategoryOrder}`);
      console.log(`     createdAt: ${post.createdAt} (${new Date(post.createdAt).toLocaleString('ko-KR')})`);
    });

    // 정렬 확인
    let isCorrectOrder = true;
    for (let i = 0; i < posts.length - 1; i++) {
      // categoryOrder가 작을수록 최신 글이어야 함 (음수 타임스탬프)
      if (posts[i].createdAt < posts[i + 1].createdAt) {
        isCorrectOrder = false;
        console.log(`\n⚠️  정렬 오류 발견!`);
        console.log(`     ${posts[i].title} (${posts[i].createdAt})`);
        console.log(`     ${posts[i + 1].title} (${posts[i + 1].createdAt})`);
      }
    }

    if (isCorrectOrder) {
      console.log(`\n✅ 정렬 순서 정상: 최신 게시글이 먼저 표시됩니다.`);
    }
  }

  console.log('\n========================================');
  console.log('전체 게시글 (allCategoryOrder 기준 정렬)');
  console.log('========================================\n');

  // allCategoryOrder 기준으로 정렬
  const allPosts = results.map(r => r.updatedPost);
  allPosts.sort((a, b) => {
    const aOrder = a.allCategoryOrder || 0;
    const bOrder = b.allCategoryOrder || 0;
    return aOrder - bOrder; // 오름차순: 작은 음수 = 최신
  });

  allPosts.forEach((post, index) => {
    console.log(`${index + 1}. [${post.category}] ${post.title}`);
    console.log(`   allCategoryOrder: ${post.allCategoryOrder}`);
    console.log(`   createdAt: ${post.createdAt} (${new Date(post.createdAt).toLocaleString('ko-KR')})\n`);
  });

  // 전체 정렬 확인
  let isCorrectOrder = true;
  for (let i = 0; i < allPosts.length - 1; i++) {
    if (allPosts[i].createdAt < allPosts[i + 1].createdAt) {
      isCorrectOrder = false;
      console.log(`\n⚠️  전체 정렬 오류 발견!`);
    }
  }

  if (isCorrectOrder) {
    console.log(`\n✅ 전체 정렬 순서 정상: 최신 게시글이 먼저 표시됩니다.`);
  }

  console.log('\n========================================');
  console.log('테스트 완료');
  console.log('========================================\n');

  // Firebase 앱 종료
  await admin.app().delete();
}

// 스크립트 실행
createTestPosts().catch(error => {
  console.error('테스트 실행 중 오류 발생:', error);
  process.exit(1);
});
