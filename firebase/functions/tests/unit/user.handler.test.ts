/**
 * Unit Test: user.handler.ts
 * handleUserUpdate 함수 테스트
 *
 * Mocking: Firebase Admin SDK (database, logger)
 */

import {expect} from "chai";
import * as sinon from "sinon";
import * as admin from "firebase-admin";
import {handleUserCreate, handleUserUpdate} from "../../src/handlers/user.handler";
import {UserData} from "../../src/types";

// Firebase Admin 초기화 (테스트 파일 로드 시 한 번만 실행)
if (!admin.apps.length) {
  // 환경 변수 설정으로 실제 credential 조회 방지
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = "localhost:9000";

  admin.initializeApp({
    projectId: "test-project",
    databaseURL: "https://test-project.firebaseio.com",
  });
}

describe("user.handler - 사용자 정보 업데이트 처리", () => {
  let sandbox: sinon.SinonSandbox;
  let refStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Database 스텁 설정
    updateStub = sandbox.stub().resolves();
    refStub = sandbox.stub().returns({
      update: updateStub,
    });

    // admin.database()를 모킹
    const databaseStub = sandbox.stub(admin, "database") as any;
    databaseStub.returns({
      ref: refStub,
      ServerValue: admin.database.ServerValue,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("handleUserUpdate - 사용자 정보 업데이트 처리", () => {
    describe("✅ 정상 케이스", () => {
      it("displayName이 변경되면 updatedAt과 displayNameLowerCase를 업데이트한다", async () => {
        // Given: displayName이 변경된 경우
        const uid = "user-123";
        const beforeData: UserData = {
          displayName: "OldName",
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: "NewName",
          createdAt: 1000000,
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.uid).to.equal(uid);
        expect(result.updated).to.be.true;

        // Then: update() 호출 확인
        expect(updateStub.calledOnce).to.be.true;
        const updates = updateStub.firstCall.args[0];

        // Then: updatedAt 업데이트 확인
        expect(updates[`users/${uid}/updatedAt`]).to.be.a("number");
        expect(updates[`users/${uid}/updatedAt`]).to.be.greaterThan(1000000);

        // Then: displayNameLowerCase 업데이트 확인
        expect(updates[`users/${uid}/displayNameLowerCase`]).to.equal("newname");
      });

      it("photoUrl이 변경되면 updatedAt만 업데이트한다", async () => {
        // Given: photoUrl이 변경된 경우
        const uid = "user-456";
        const beforeData: UserData = {
          displayName: "SameName",
          photoUrl: "https://old-photo.jpg",
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: "SameName",
          photoUrl: "https://new-photo.jpg",
          createdAt: 1000000,
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.updated).to.be.true;

        // Then: update() 호출 확인
        expect(updateStub.calledOnce).to.be.true;
        const updates = updateStub.firstCall.args[0];

        // Then: updatedAt만 업데이트되고 displayNameLowerCase는 업데이트되지 않음
        expect(updates[`users/${uid}/updatedAt`]).to.be.a("number");
        expect(updates[`users/${uid}/displayNameLowerCase`]).to.be.undefined;
      });

      it("displayName과 photoUrl이 모두 변경되면 모든 필드를 업데이트한다", async () => {
        // Given: displayName과 photoUrl이 모두 변경된 경우
        const uid = "user-789";
        const beforeData: UserData = {
          displayName: "OldName",
          photoUrl: "https://old-photo.jpg",
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: "NewName",
          photoUrl: "https://new-photo.jpg",
          createdAt: 1000000,
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.updated).to.be.true;

        // Then: update() 호출 확인
        expect(updateStub.calledOnce).to.be.true;
        const updates = updateStub.firstCall.args[0];

        // Then: updatedAt과 displayNameLowerCase 모두 업데이트 확인
        expect(updates[`users/${uid}/updatedAt`]).to.be.a("number");
        expect(updates[`users/${uid}/displayNameLowerCase`]).to.equal("newname");
      });

      it("createdAt이 없으면 자동으로 생성한다", async () => {
        // Given: afterData에 createdAt이 없고, beforeData에는 있는 경우
        const uid = "user-new";
        const beforeData: UserData = {
          displayName: "Name",
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: "Name",
          // createdAt 없음
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.updated).to.be.true;

        // Then: update() 호출 확인
        expect(updateStub.calledOnce).to.be.true;
        const updates = updateStub.firstCall.args[0];

        // Then: createdAt이 beforeData의 값으로 설정됨
        expect(updates[`users/${uid}/createdAt`]).to.equal(1000000);
      });

      it("createdAt이 beforeData와 afterData 모두 없으면 현재 시간으로 생성한다", async () => {
        // Given: beforeData와 afterData 모두 createdAt이 없는 경우
        const uid = "user-new-2";
        const beforeData: UserData = {
          displayName: "Name",
        };
        const afterData: UserData = {
          displayName: "Name",
        };

        const beforeTime = Date.now();

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        const afterTime = Date.now();

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.updated).to.be.true;

        // Then: update() 호출 확인
        expect(updateStub.calledOnce).to.be.true;
        const updates = updateStub.firstCall.args[0];

        // Then: createdAt이 현재 시간으로 설정됨
        expect(updates[`users/${uid}/createdAt`]).to.be.a("number");
        expect(updates[`users/${uid}/createdAt`]).to.be.at.least(beforeTime);
        expect(updates[`users/${uid}/createdAt`]).to.be.at.most(afterTime);
      });
    });

    describe("❌ 변경 없음 케이스", () => {
      it("displayName과 photoUrl이 변경되지 않으면 updatedAt을 업데이트하지 않는다", async () => {
        // Given: displayName과 photoUrl이 변경되지 않은 경우
        const uid = "user-unchanged";
        const beforeData: UserData = {
          displayName: "SameName",
          photoUrl: "https://same-photo.jpg",
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: "SameName",
          photoUrl: "https://same-photo.jpg",
          createdAt: 1000000,
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: 성공 응답이지만 업데이트되지 않음
        expect(result.success).to.be.true;
        expect(result.updated).to.be.false;

        // Then: update() 호출되지 않음
        expect(updateStub.called).to.be.false;
      });

      it("다른 필드만 변경되고 displayName과 photoUrl은 변경되지 않으면 업데이트하지 않는다", async () => {
        // Given: gender 등 다른 필드만 변경된 경우
        const uid = "user-other-field";
        const beforeData: UserData = {
          displayName: "SameName",
          photoUrl: "https://same-photo.jpg",
          gender: "M",
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: "SameName",
          photoUrl: "https://same-photo.jpg",
          gender: "F",
          createdAt: 1000000,
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: 성공 응답이지만 업데이트되지 않음
        expect(result.success).to.be.true;
        expect(result.updated).to.be.false;

        // Then: update() 호출되지 않음
        expect(updateStub.called).to.be.false;
      });
    });

    describe("🔍 경계값 테스트", () => {
      it("photoURL(대문자)과 photoUrl(소문자)을 모두 처리한다", async () => {
        // Given: beforeData는 photoURL(대문자), afterData는 photoUrl(소문자)
        const uid = "user-photo-case";
        const beforeData: UserData = {
          displayName: "Name",
          photoURL: "https://old-photo.jpg", // 대문자
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: "Name",
          photoUrl: "https://new-photo.jpg", // 소문자
          createdAt: 1000000,
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: photoUrl 변경으로 감지되어 updatedAt 업데이트됨
        expect(result.success).to.be.true;
        expect(result.updated).to.be.true;

        const updates = updateStub.firstCall.args[0];
        expect(updates[`users/${uid}/updatedAt`]).to.be.a("number");
      });

      it("빈 문자열과 null/undefined를 구분한다", async () => {
        // Given: displayName이 빈 문자열에서 null로 변경
        const uid = "user-empty-string";
        const beforeData: UserData = {
          displayName: "",
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: undefined,
          createdAt: 1000000,
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: 변경으로 감지되어 updatedAt 업데이트됨
        expect(result.success).to.be.true;
        expect(result.updated).to.be.true;

        const updates = updateStub.firstCall.args[0];
        expect(updates[`users/${uid}/updatedAt`]).to.be.a("number");
      });

      it("매우 긴 displayName을 처리한다", async () => {
        // Given: 매우 긴 displayName
        const uid = "user-long-name";
        const longName = "A".repeat(1000);
        const beforeData: UserData = {
          displayName: "Short",
          createdAt: 1000000,
        };
        const afterData: UserData = {
          displayName: longName,
          createdAt: 1000000,
        };

        // When: 사용자 정보 업데이트 처리
        const result = await handleUserUpdate(uid, beforeData, afterData);

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.updated).to.be.true;

        const updates = updateStub.firstCall.args[0];
        expect(updates[`users/${uid}/displayNameLowerCase`]).to.equal(longName.toLowerCase());
      });
    });
  });

  describe("handleUserCreate - 사용자 생성 처리", () => {
    let incrementActionCounterStub: sinon.SinonStub;

    beforeEach(() => {
      // incrementActionCounter 함수 스텁 (별도 모듈이므로 require로 가져와서 스텁)
      const userActionCountersHandler = require("../../src/handlers/user-action-counters.handler");
      incrementActionCounterStub = sandbox.stub(userActionCountersHandler, "incrementActionCounter").resolves();
    });

    describe("✅ 정상 케이스", () => {
      it("신규 사용자 생성 시 createdAt과 registerOrder를 자동으로 생성한다", async () => {
        // Given: createdAt이 없는 신규 사용자 데이터
        const uid = "new-user-123";
        const userData: UserData = {
          displayName: "New User",
        };

        const beforeTime = Date.now();

        // When: 사용자 생성 처리
        const result = await handleUserCreate(uid, userData);

        const afterTime = Date.now();

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.uid).to.equal(uid);

        // Then: update() 호출 확인
        expect(updateStub.calledOnce).to.be.true;
        const updates = updateStub.firstCall.args[0];

        // Then: createdAt이 현재 시간으로 생성됨
        expect(updates[`users/${uid}/createdAt`]).to.be.a("number");
        expect(updates[`users/${uid}/createdAt`]).to.be.at.least(beforeTime);
        expect(updates[`users/${uid}/createdAt`]).to.be.at.most(afterTime);

        // Then: registerOrder가 생성됨
        const createdAt = updates[`users/${uid}/createdAt`] as number;
        const expectedRegisterOrder = Number.MAX_SAFE_INTEGER - createdAt;
        expect(updates[`users/${uid}/registerOrder`]).to.equal(expectedRegisterOrder);

        // Then: incrementActionCounter 호출 확인
        expect(incrementActionCounterStub.calledOnce).to.be.true;
        expect(incrementActionCounterStub.firstCall.args).to.deep.equal([uid, "user", 1]);
      });

      it("createdAt이 제공된 경우 해당 값을 사용한다", async () => {
        // Given: createdAt이 제공된 사용자 데이터
        const uid = "user-with-created-at";
        const providedCreatedAt = 1700000000000;
        const userData: UserData = {
          displayName: "User",
          createdAt: providedCreatedAt,
        };

        // When: 사용자 생성 처리
        const result = await handleUserCreate(uid, userData);

        // Then: 성공 응답
        expect(result.success).to.be.true;

        // Then: update() 호출 확인
        expect(updateStub.calledOnce).to.be.true;
        const updates = updateStub.firstCall.args[0];

        // Then: createdAt이 제공된 값으로 설정되지 않음 (이미 있으므로)
        // handleUserCreate에서는 createdAt이 없을 때만 저장하므로, 제공된 경우 업데이트에 포함되지 않음
        expect(updates[`users/${uid}/createdAt`]).to.be.undefined;

        // Then: registerOrder는 제공된 createdAt으로 계산됨
        const expectedRegisterOrder = Number.MAX_SAFE_INTEGER - providedCreatedAt;
        expect(updates[`users/${uid}/registerOrder`]).to.equal(expectedRegisterOrder);
      });

      it("최신 사용자일수록 더 작은 registerOrder 값을 가진다", async () => {
        // Given: 두 명의 사용자 (오래된 사용자와 최신 사용자)
        const oldUserUid = "old-user";
        const newUserUid = "new-user";

        const oldUserCreatedAt = 1600000000000; // 오래된 시간
        const newUserCreatedAt = 1700000000000; // 최신 시간

        const oldUserData: UserData = {
          displayName: "Old User",
          createdAt: oldUserCreatedAt,
        };

        const newUserData: UserData = {
          displayName: "New User",
          createdAt: newUserCreatedAt,
        };

        // When: 오래된 사용자 생성
        await handleUserCreate(oldUserUid, oldUserData);
        const oldUpdates = updateStub.firstCall.args[0];
        const oldUserRegisterOrder = oldUpdates[`users/${oldUserUid}/registerOrder`] as number;

        // When: 최신 사용자 생성
        updateStub.resetHistory();
        await handleUserCreate(newUserUid, newUserData);
        const newUpdates = updateStub.firstCall.args[0];
        const newUserRegisterOrder = newUpdates[`users/${newUserUid}/registerOrder`] as number;

        // Then: 최신 사용자의 registerOrder가 더 작음
        expect(newUserRegisterOrder).to.be.lessThan(oldUserRegisterOrder);

        // Then: 오름차순 정렬 시 최신 사용자가 먼저 표시됨
        const sortedUsers = [
          {uid: oldUserUid, registerOrder: oldUserRegisterOrder},
          {uid: newUserUid, registerOrder: newUserRegisterOrder},
        ].sort((a, b) => a.registerOrder - b.registerOrder);

        expect(sortedUsers[0].uid).to.equal(newUserUid); // 최신 사용자가 첫 번째
        expect(sortedUsers[1].uid).to.equal(oldUserUid); // 오래된 사용자가 두 번째
      });
    });

    describe("🔍 계산식 검증", () => {
      it("registerOrder 계산식이 정확하다 (Number.MAX_SAFE_INTEGER - createdAt)", async () => {
        // Given: 특정 createdAt 값
        const uid = "test-calculation";
        const createdAt = 1234567890000;
        const userData: UserData = {
          displayName: "Test",
          createdAt: createdAt,
        };

        // When: 사용자 생성 처리
        await handleUserCreate(uid, userData);

        // Then: registerOrder 계산 검증
        const updates = updateStub.firstCall.args[0];
        const registerOrder = updates[`users/${uid}/registerOrder`] as number;

        expect(registerOrder).to.equal(Number.MAX_SAFE_INTEGER - createdAt);
        expect(registerOrder).to.equal(9007199254740991 - 1234567890000);
      });
    });
  });
});
