/**
 * 게시글 정렬 확인 스크립트
 *
 * posts 노드에서 최신 5개 게시글을 조회하여
 * categoryOrder와 allCategoryOrder 값이 올바르게 설정되었는지 확인합니다.
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin 초기화
const serviceAccount = require(path.join(__dirname, '../firebase/functions/firebase-service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://withcenter-test-4-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function checkPostOrder() {
  console.log('========================================');
  console.log('게시글 정렬 확인');
  console.log('========================================\n');

  try {
    // allCategoryOrder 기준으로 최신 5개 게시글 조회
    console.log('📊 allCategoryOrder 기준 최신 5개 게시글:\n');

    const postsRef = db.ref('posts');
    const query = postsRef.orderByChild('allCategoryOrder').limitToFirst(5);
    const snapshot = await query.once('value');

    if (!snapshot.exists()) {
      console.log('⚠️  게시글이 없습니다.');
      await admin.app().delete();
      return;
    }

    const posts = [];
    snapshot.forEach((childSnapshot) => {
      const post = childSnapshot.val();
      posts.push({
        postId: childSnapshot.key,
        title: post.title || post.text?.substring(0, 50) || '제목 없음',
        category: post.category,
        createdAt: post.createdAt,
        categoryOrder: post.categoryOrder,
        allCategoryOrder: post.allCategoryOrder,
        createdAtDate: new Date(post.createdAt).toLocaleString('ko-KR')
      });
    });

    // 결과 출력
    posts.forEach((post, index) => {
      console.log(`${index + 1}. [${post.category}] ${post.title}`);
      console.log(`   postId: ${post.postId}`);
      console.log(`   createdAt: ${post.createdAt} (${post.createdAtDate})`);
      console.log(`   allCategoryOrder: ${post.allCategoryOrder}`);
      console.log(`   categoryOrder: ${post.categoryOrder}`);
      console.log('');
    });

    // 정렬 검증
    console.log('========================================');
    console.log('정렬 순서 검증');
    console.log('========================================\n');

    let isValid = true;
    for (let i = 0; i < posts.length - 1; i++) {
      const current = posts[i];
      const next = posts[i + 1];

      // allCategoryOrder 검증: 작은 값(더 큰 음수)이 최신이어야 함
      const currentOrder = current.allCategoryOrder || 0;
      const nextOrder = next.allCategoryOrder || 0;

      console.log(`비교: ${current.title.substring(0, 30)} (${currentOrder})`);
      console.log(`  vs  ${next.title.substring(0, 30)} (${nextOrder})`);

      if (currentOrder > nextOrder) {
        console.log(`  ⚠️  정렬 오류: ${currentOrder} > ${nextOrder}\n`);
        isValid = false;
      } else {
        console.log(`  ✅ 정상: ${currentOrder} <= ${nextOrder}\n`);
      }

      // createdAt 검증: 최신 글이 먼저 표시되어야 함
      if (current.createdAt < next.createdAt) {
        console.log(`  ⚠️  시간 순서 오류: 오래된 글이 먼저 표시됨`);
        console.log(`     ${current.createdAtDate} < ${next.createdAtDate}\n`);
        isValid = false;
      }
    }

    if (isValid) {
      console.log('✅ 모든 게시글이 올바르게 정렬되었습니다!');
      console.log('   - allCategoryOrder가 음수 타임스탬프로 저장됨');
      console.log('   - 최신 게시글이 먼저 표시됨');
    } else {
      console.log('❌ 정렬 순서에 문제가 있습니다.');
    }

    // 음수 타임스탬프 확인
    console.log('\n========================================');
    console.log('음수 타임스탬프 확인');
    console.log('========================================\n');

    const hasNegativeTimestamp = posts.some(p => p.allCategoryOrder < 0);
    const allNegative = posts.every(p => p.allCategoryOrder < 0);

    if (allNegative) {
      console.log('✅ 모든 게시글의 allCategoryOrder가 음수입니다.');
    } else if (hasNegativeTimestamp) {
      console.log('⚠️  일부 게시글만 음수 타임스탬프를 사용합니다.');
    } else {
      console.log('❌ 음수 타임스탬프가 사용되지 않았습니다.');
    }

    console.log('\n========================================');
    console.log('완료');
    console.log('========================================');

  } catch (error) {
    console.error('오류 발생:', error);
  }

  await admin.app().delete();
}

checkPostOrder().catch(error => {
  console.error('실행 중 오류:', error);
  process.exit(1);
});
