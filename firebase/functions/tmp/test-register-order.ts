/**
 * registerOrder 필드 테스트 스크립트
 * handleUserCreate 함수의 registerOrder 필드 생성을 검증합니다.
 */

import * as admin from "firebase-admin";
import {handleUserCreate} from "../src/handlers/user.handler";

// Firebase Admin 초기화
const serviceAccount = require("../firebase-service-account-key.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://withcenter-test-3.firebaseio.com",
  });
}

async function testRegisterOrder() {
  console.log("🧪 registerOrder 필드 테스트 시작\n");

  try {
    // 테스트 사용자 UID
    const testUid1 = `test-user-old-${Date.now()}`;
    const testUid2 = `test-user-new-${Date.now()}`;

    // 1. 오래된 사용자 생성 (과거 시간)
    const oldCreatedAt = 1600000000000;
    console.log(`1️⃣  오래된 사용자 생성: ${testUid1}`);
    console.log(`   createdAt: ${oldCreatedAt}`);

    await handleUserCreate(testUid1, {
      displayName: "Old User",
      createdAt: oldCreatedAt,
    });

    // 2. 최신 사용자 생성 (최신 시간)
    const newCreatedAt = 1700000000000;
    console.log(`\n2️⃣  최신 사용자 생성: ${testUid2}`);
    console.log(`   createdAt: ${newCreatedAt}`);

    await handleUserCreate(testUid2, {
      displayName: "New User",
      createdAt: newCreatedAt,
    });

    // 3. 데이터 읽기
    console.log("\n3️⃣  생성된 데이터 확인");

    const oldUserSnapshot = await admin.database().ref(`users/${testUid1}`).once("value");
    const newUserSnapshot = await admin.database().ref(`users/${testUid2}`).once("value");

    const oldUserData = oldUserSnapshot.val();
    const newUserData = newUserSnapshot.val();

    console.log(`\n   오래된 사용자 (${testUid1}):`);
    console.log(`   - createdAt: ${oldUserData.createdAt}`);
    console.log(`   - registerOrder: ${oldUserData.registerOrder}`);

    console.log(`\n   최신 사용자 (${testUid2}):`);
    console.log(`   - createdAt: ${newUserData.createdAt}`);
    console.log(`   - registerOrder: ${newUserData.registerOrder}`);

    // 4. 검증
    console.log("\n4️⃣  검증");

    // 4-1. registerOrder 필드가 존재하는지 확인
    if (!oldUserData.registerOrder || !newUserData.registerOrder) {
      throw new Error("❌ registerOrder 필드가 생성되지 않았습니다!");
    }
    console.log("   ✅ registerOrder 필드가 정상적으로 생성되었습니다");

    // 4-2. registerOrder 계산식 확인
    const expectedOldRegisterOrder = Number.MAX_SAFE_INTEGER - oldCreatedAt;
    const expectedNewRegisterOrder = Number.MAX_SAFE_INTEGER - newCreatedAt;

    if (oldUserData.registerOrder !== expectedOldRegisterOrder) {
      throw new Error(
        `❌ 오래된 사용자 registerOrder 계산 오류!\n` +
        `   기대값: ${expectedOldRegisterOrder}\n` +
        `   실제값: ${oldUserData.registerOrder}`
      );
    }

    if (newUserData.registerOrder !== expectedNewRegisterOrder) {
      throw new Error(
        `❌ 최신 사용자 registerOrder 계산 오류!\n` +
        `   기대값: ${expectedNewRegisterOrder}\n` +
        `   실제값: ${newUserData.registerOrder}`
      );
    }
    console.log("   ✅ registerOrder 계산식이 정확합니다 (Number.MAX_SAFE_INTEGER - createdAt)");

    // 4-3. 최신 사용자의 registerOrder가 더 작은지 확인
    if (newUserData.registerOrder >= oldUserData.registerOrder) {
      throw new Error(
        `❌ 최신 사용자의 registerOrder가 더 작아야 합니다!\n` +
        `   오래된 사용자: ${oldUserData.registerOrder}\n` +
        `   최신 사용자: ${newUserData.registerOrder}`
      );
    }
    console.log("   ✅ 최신 사용자의 registerOrder가 더 작습니다");

    // 4-4. 오름차순 정렬 시 최신 사용자가 먼저 표시되는지 확인
    const users = [
      {uid: testUid1, registerOrder: oldUserData.registerOrder},
      {uid: testUid2, registerOrder: newUserData.registerOrder},
    ].sort((a, b) => a.registerOrder - b.registerOrder);

    if (users[0].uid !== testUid2) {
      throw new Error("❌ 오름차순 정렬 시 최신 사용자가 첫 번째에 오지 않습니다!");
    }
    console.log("   ✅ 오름차순 정렬 시 최신 사용자가 먼저 표시됩니다");

    // 5. 테스트 데이터 정리
    console.log("\n5️⃣  테스트 데이터 정리");
    await admin.database().ref(`users/${testUid1}`).remove();
    await admin.database().ref(`users/${testUid2}`).remove();
    console.log("   ✅ 테스트 데이터가 삭제되었습니다");

    console.log("\n✅ 모든 테스트 통과! registerOrder 필드가 정상적으로 동작합니다.\n");
  } catch (error) {
    console.error("\n❌ 테스트 실패:", error);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

testRegisterOrder()
  .then(() => {
    console.log("🎉 테스트 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("테스트 실행 중 오류 발생:", error);
    process.exit(1);
  });
