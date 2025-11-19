/**
 * 인플루언서 점수 확인 스크립트
 *
 * 사용법:
 * node tmp/check-influencer-score.js {uid}
 *
 * 예시:
 * node tmp/check-influencer-score.js gV2MXp5MUjZr77P9WamahOwOZG53
 */

const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: 'https://sonub-firebase-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const db = admin.database();

/**
 * UTC 기준 현재 날짜 포맷팅
 */
function formatDate(format) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  if (format === 'yyyyMMdd') return `${year}${month}${day}`;
  if (format === 'yyyyMM') return `${year}${month}`;
  if (format === 'yyyy') return `${year}`;
  return '';
}

/**
 * 특정 사용자의 인플루언서 점수 및 통계 조회
 */
async function checkUserInfluencerScore(uid) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 사용자 인플루언서 통계 조회: ${uid}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. 인플루언서 점수 조회
    const scoreSnapshot = await db.ref(`influencer-scores/${uid}`).once('value');
    const score = scoreSnapshot.val() || 0;

    console.log('✅ 인플루언서 점수:', score);

    // 2. 전체 통계 조회
    const totalStatsSnapshot = await db.ref(`user-stats/${uid}/total`).once('value');
    const totalStats = totalStatsSnapshot.val() || {};

    console.log('\n✅ 전체 통계:');
    console.log('  - 받은 좋아요 수:', totalStats.receivedLikes || 0);
    console.log('  - 받은 댓글 수:', totalStats.receivedComments || 0);
    console.log('  - 받은 팔로워 수:', totalStats.receivedFollowers || 0);
    console.log('  - 작성한 게시글 수:', totalStats.createdPosts || 0);
    console.log('  - 작성한 댓글 수:', totalStats.createdComments || 0);

    // 3. 일간 통계 조회
    const today = formatDate('yyyyMMdd');
    const dailyStatsSnapshot = await db.ref(`user-stats/${uid}/daily/${today}`).once('value');
    const dailyStats = dailyStatsSnapshot.val() || {};

    console.log(`\n✅ 일간 통계 (${today}):`);
    console.log('  - 받은 좋아요 수:', dailyStats.receivedLikes || 0);
    console.log('  - 받은 댓글 수:', dailyStats.receivedComments || 0);
    console.log('  - 받은 팔로워 수:', dailyStats.receivedFollowers || 0);
    console.log('  - 작성한 게시글 수:', dailyStats.createdPosts || 0);
    console.log('  - 작성한 댓글 수:', dailyStats.createdComments || 0);

    // 4. 점수 계산 검증
    const expectedScore =
      (totalStats.receivedLikes || 0) * 3 +
      (totalStats.receivedComments || 0) * 10 +
      (totalStats.receivedFollowers || 0) * 60;

    console.log('\n✅ 점수 검증:');
    console.log('  - 계산된 점수:', expectedScore);
    console.log('  - 실제 점수:', score);
    console.log('  - 일치 여부:', expectedScore === score ? '✅ 일치' : '❌ 불일치');

    if (expectedScore !== score) {
      console.log('  ⚠️  점수 불일치 원인: 게시글 작성/삭제 페널티, 증분 계산 시스템');
      console.log('  ℹ️  게시글 생성: +50점');
      console.log('  ℹ️  게시글 삭제: -55점 (페널티 -5점 포함)');
      console.log('  ℹ️  댓글 생성: +8점');
      console.log('  ℹ️  댓글 삭제: -10점 (페널티 -2점 포함)');
    }

    // 5. 일간 순위 조회
    const dailyRankingSnapshot = await db.ref(`influencer-rankings/daily/${today}`).once('value');
    const dailyRanking = dailyRankingSnapshot.val() || {};
    const userDailyRank = dailyRanking[uid];

    console.log('\n✅ 순위 정보:');
    if (userDailyRank !== undefined) {
      console.log(`  - 일간 순위 점수: ${-userDailyRank} (저장값: ${userDailyRank})`);
    } else {
      console.log('  - 일간 순위: 순위 없음 (점수 0)');
    }

    // 6. 전체 순위 조회
    const totalRankingSnapshot = await db.ref('influencer-rankings/total').once('value');
    const totalRanking = totalRankingSnapshot.val() || {};
    const userTotalRank = totalRanking[uid];

    if (userTotalRank !== undefined) {
      console.log(`  - 전체 순위 점수: ${-userTotalRank} (저장값: ${userTotalRank})`);
    } else {
      console.log('  - 전체 순위: 순위 없음 (점수 0)');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 조회 실패:', error.message);
  } finally {
    process.exit(0);
  }
}

/**
 * Top N 인플루언서 조회
 */
async function checkTopInfluencers(period = 'total', limit = 10) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏆 Top ${limit} 인플루언서 순위 (${period})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    let path = 'influencer-rankings/total';

    if (period === 'daily') {
      const today = formatDate('yyyyMMdd');
      path = `influencer-rankings/daily/${today}`;
    } else if (period === 'monthly') {
      const thisMonth = formatDate('yyyyMM');
      path = `influencer-rankings/monthly/${thisMonth}`;
    } else if (period === 'yearly') {
      const thisYear = formatDate('yyyy');
      path = `influencer-rankings/yearly/${thisYear}`;
    }

    const snapshot = await db.ref(path)
      .orderByValue()
      .limitToFirst(limit)
      .once('value');

    const rankings = snapshot.val() || {};
    const sortedRankings = Object.entries(rankings)
      .map(([uid, score]) => ({ uid, score: -score }))
      .sort((a, b) => b.score - a.score);

    if (sortedRankings.length === 0) {
      console.log('  ℹ️  순위 데이터가 없습니다.');
    } else {
      sortedRankings.forEach((entry, index) => {
        const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        console.log(`  ${medal} ${index + 1}위: ${entry.uid} (${entry.score}점)`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 순위 조회 실패:', error.message);
  } finally {
    process.exit(0);
  }
}

// CLI 인자 파싱
const args = process.argv.slice(2);
const command = args[0];

if (command === 'top') {
  const period = args[1] || 'total';
  const limit = parseInt(args[2] || '10', 10);
  checkTopInfluencers(period, limit);
} else if (command) {
  checkUserInfluencerScore(command);
} else {
  console.log('\n사용법:');
  console.log('  node tmp/check-influencer-score.js {uid}          # 특정 사용자 조회');
  console.log('  node tmp/check-influencer-score.js top [period]   # Top N 조회');
  console.log('\n예시:');
  console.log('  node tmp/check-influencer-score.js gV2MXp5MUjZr77P9WamahOwOZG53');
  console.log('  node tmp/check-influencer-score.js top');
  console.log('  node tmp/check-influencer-score.js top daily 5');
  console.log('  node tmp/check-influencer-score.js top monthly 10\n');
  process.exit(1);
}
