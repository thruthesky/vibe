/**
 * categoryOrder 양수 타임스탬프 확인 스크립트
 *
 * 새로 생성된 게시글의 categoryOrder와 allCategoryOrder 값을 확인합니다.
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin 초기화
const serviceAccount = require(path.join(__dirname, '../firebase-service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sonub-firebase-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

async function verifyPost() {
  console.log('========================================');
  console.log('categoryOrder 양수 타임스탬프 확인');
  console.log('========================================\n');

  try {
    // 특정 게시글 조회
    const postId = '-OeRYhzCCyh4nNG_mQqN';
    const postRef = db.ref(`posts/${postId}`);
    const snapshot = await postRef.once('value');

    if (!snapshot.exists()) {
      console.log('⚠️  게시글을 찾을 수 없습니다.');
      await admin.app().delete();
      return;
    }

    const post = snapshot.val();

    console.log('📝 게시글 정보:');
    console.log(`  postId: ${postId}`);
    console.log(`  text: ${post.text}`);
    console.log(`  category: ${post.category}`);
    console.log(`  createdAt: ${post.createdAt}`);
    console.log(`  createdAtDate: ${new Date(post.createdAt).toLocaleString('ko-KR')}`);
    console.log(`\n✅ categoryOrder: ${post.categoryOrder}`);
    console.log(`✅ allCategoryOrder: ${post.allCategoryOrder}`);

    // 타임스탬프 확인
    const expectedPositiveCategoryOrder = `${post.category}-${post.createdAt}`;
    const expectedNegativeAllCategoryOrder = -post.createdAt;

    console.log('\n========================================');
    console.log('검증 결과');
    console.log('========================================\n');

    console.log('1. categoryOrder 검증:');
    console.log(`   예상값 (양수): ${expectedPositiveCategoryOrder}`);
    console.log(`   실제값: ${post.categoryOrder}`);
    if (post.categoryOrder === expectedPositiveCategoryOrder) {
      console.log('   ✅ 통과: categoryOrder가 양수 타임스탬프로 올바르게 저장됨\n');
    } else {
      console.log('   ❌ 실패: categoryOrder가 예상과 다름\n');
    }

    console.log('2. allCategoryOrder 검증:');
    console.log(`   예상값 (음수): ${expectedNegativeAllCategoryOrder}`);
    console.log(`   실제값: ${post.allCategoryOrder}`);
    if (post.allCategoryOrder === expectedNegativeAllCategoryOrder) {
      console.log('   ✅ 통과: allCategoryOrder가 음수 타임스탬프로 올바르게 저장됨\n');
    } else {
      console.log('   ❌ 실패: allCategoryOrder가 예상과 다름\n');
    }

    // 추가 게시글 5개 조회하여 정렬 확인
    console.log('========================================');
    console.log('최신 5개 게시글 정렬 확인');
    console.log('========================================\n');

    const postsRef = db.ref('posts');
    const query = postsRef.orderByChild('allCategoryOrder').limitToFirst(5);
    const querySnapshot = await query.once('value');

    const posts = [];
    querySnapshot.forEach((childSnapshot) => {
      const p = childSnapshot.val();
      posts.push({
        postId: childSnapshot.key,
        text: p.text?.substring(0, 50) || '제목 없음',
        category: p.category,
        createdAt: p.createdAt,
        categoryOrder: p.categoryOrder,
        allCategoryOrder: p.allCategoryOrder,
        createdAtDate: new Date(p.createdAt).toLocaleString('ko-KR')
      });
    });

    posts.forEach((p, index) => {
      console.log(`${index + 1}. [${p.category}] ${p.text}`);
      console.log(`   postId: ${p.postId}`);
      console.log(`   categoryOrder: ${p.categoryOrder}`);
      console.log(`   allCategoryOrder: ${p.allCategoryOrder}`);
      console.log(`   createdAt: ${p.createdAt} (${p.createdAtDate})\n`);
    });

    // 정렬 순서 검증
    let isCorrectOrder = true;
    for (let i = 0; i < posts.length - 1; i++) {
      if (posts[i].allCategoryOrder > posts[i + 1].allCategoryOrder) {
        console.log('❌ 정렬 오류: allCategoryOrder가 오름차순이 아님');
        isCorrectOrder = false;
        break;
      }

      if (posts[i].createdAt < posts[i + 1].createdAt) {
        console.log('❌ 정렬 오류: 최신 글이 먼저 표시되지 않음');
        isCorrectOrder = false;
        break;
      }
    }

    if (isCorrectOrder) {
      console.log('✅ 정렬 순서 정상: 최신 게시글이 먼저 표시됨');
    }

    console.log('\n========================================');
    console.log('완료');
    console.log('========================================');

  } catch (error) {
    console.error('오류 발생:', error);
  }

  await admin.app().delete();
}

verifyPost().catch(error => {
  console.error('실행 중 오류:', error);
  process.exit(1);
});
