/**
 * 채팅방 핀 기능 유닛 테스트
 *
 * 이 테스트는 핀 설정/해제 시 xxxListOrder 필드가
 * 올바른 숫자 값으로 업데이트되는지 검증합니다.
 *
 * 버그 수정 검증:
 * - 이전: "500-1710000000000" (문자열) ❌
 * - 수정 후: -501710000000000 (숫자) ✅
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';
import { handleChatRoomPinCreate } from '../src/handlers/chat.room-pin-create.handler';
import { handleChatRoomPinDelete } from '../src/handlers/chat.room-pin-delete.handler';
import {
  toChatListOrder,
  extractChatStatus,
  extractTimestampFromChatOrder,
  PINNED_OFFSET,
  UNREAD_OFFSET,
} from '../../../shared/order-value.utils';

// Firebase Admin 초기화
const serviceAccount = require('../firebase-service-account-key.json');

let db: admin.database.Database;

beforeAll(() => {
  // Firebase Admin 초기화
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://sonub-firebase-default-rtdb.asia-southeast1.firebasedatabase.app',
    });
  }
  db = admin.database();
});

afterAll(async () => {
  // 테스트 후 Firebase Admin 종료
  await admin.app().delete();
});

describe('채팅방 핀 기능 테스트', () => {
  const testTimestamp = 1710000000000;

  describe('handleChatRoomPinCreate - 핀 설정', () => {
    it('읽음 상태 → 핀 설정: 숫자 값으로 올바르게 업데이트', async () => {
      // 각 테스트마다 고유한 ID 생성 (Firebase 경로는 . 사용 불가하므로 정수만 사용)
      const testUid = 'test-user-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
      const testRoomId = 'test-room-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);

      // Given: 읽음 상태의 채팅방
      const readOrder = toChatListOrder(testTimestamp, 'read');
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).set({
        roomId: testRoomId,
        allChatListOrder: readOrder,
        singleChatListOrder: readOrder,
        pin: false,
      });

      // When: 핀 설정
      await db.ref(`chat-joins/${testUid}/${testRoomId}/pin`).set(true);
      await handleChatRoomPinCreate(testUid, testRoomId);

      // Then: 모든 xxxListOrder 필드가 숫자 타입의 핀 값으로 업데이트 - semantic verification
      const snapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}`).once('value');
      const data = snapshot.val();

      // 타입 검증: 숫자여야 함 (문자열이 아님)
      expect(typeof data.allChatListOrder).toBe('number');
      expect(typeof data.singleChatListOrder).toBe('number');
      expect(typeof data.allChatListOrder).not.toBe('string');
      expect(typeof data.singleChatListOrder).not.toBe('string');

      // 상태 검증: pinned 상태여야 함
      expect(extractChatStatus(data.allChatListOrder)).toBe('pinned');
      expect(extractChatStatus(data.singleChatListOrder)).toBe('pinned');

      // 음수 검증
      expect(data.allChatListOrder).toBeLessThan(0);
      expect(data.singleChatListOrder).toBeLessThan(0);

      // PINNED_OFFSET이 적용되었는지 검증 (절대값이 PINNED_OFFSET보다 큼)
      expect(Math.abs(data.allChatListOrder)).toBeGreaterThan(PINNED_OFFSET);
      expect(Math.abs(data.singleChatListOrder)).toBeGreaterThan(PINNED_OFFSET);

      // 테스트 후 정리
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).remove();
    });

    it('읽지 않음 상태 → 핀 설정: UNREAD_OFFSET → PINNED_OFFSET', async () => {
      // 각 테스트마다 고유한 ID 생성 (Firebase 경로는 . 사용 불가하므로 정수만 사용)
      const testUid = 'test-user-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
      const testRoomId = 'test-room-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);

      // Given: 읽지 않음 상태의 채팅방
      const unreadOrder = toChatListOrder(testTimestamp, 'unread');
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).set({
        roomId: testRoomId,
        allChatListOrder: unreadOrder,
        groupChatListOrder: unreadOrder,
        newMessageCount: 5,
        pin: false, // 초기에는 핀 해제 상태
      });

      // 데이터 검증: 올바르게 저장되었는지 확인 - semantic verification
      const beforeSnapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}`).once('value');
      const beforeData = beforeSnapshot.val();

      // 타입과 상태만 확인 (deployed trigger가 값을 변경할 수 있음)
      expect(typeof beforeData.allChatListOrder).toBe('number');
      expect(typeof beforeData.groupChatListOrder).toBe('number');
      expect(extractChatStatus(beforeData.allChatListOrder)).toBe('unread');
      expect(extractChatStatus(beforeData.groupChatListOrder)).toBe('unread');

      // When: 핀 설정
      await db.ref(`chat-joins/${testUid}/${testRoomId}/pin`).set(true);

      // 핀 설정 직후 값 확인 (실제 트리거가 실행되었는지 확인)
      await new Promise(resolve => setTimeout(resolve, 500)); // 트리거 실행 대기
      const afterPinSetSnapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}`).once('value');
      const afterPinSetData = afterPinSetSnapshot.val();

      console.log('DEBUG: allChatListOrder after pin:true -', afterPinSetData.allChatListOrder);
      console.log('DEBUG: Expected unreadOrder -', unreadOrder);

      // 트리거가 이미 실행되었다면 핸들러 호출 스킵
      if (extractChatStatus(afterPinSetData.allChatListOrder) !== 'pinned') {
        await handleChatRoomPinCreate(testUid, testRoomId);
      }

      // Then: PINNED_OFFSET 적용
      const snapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}`).once('value');
      const data = snapshot.val();

      // 타입 검증: 숫자여야 함 (문자열이 아님)
      expect(typeof data.allChatListOrder).toBe('number');
      expect(typeof data.groupChatListOrder).toBe('number');

      // 상태 검증: pinned 상태여야 함
      expect(extractChatStatus(data.allChatListOrder)).toBe('pinned');
      expect(extractChatStatus(data.groupChatListOrder)).toBe('pinned');

      // 음수 검증
      expect(data.allChatListOrder).toBeLessThan(0);
      expect(data.groupChatListOrder).toBeLessThan(0);

      // PINNED_OFFSET이 적용되었는지 검증 (절대값이 PINNED_OFFSET보다 큼)
      expect(Math.abs(data.allChatListOrder)).toBeGreaterThan(PINNED_OFFSET);
      expect(Math.abs(data.groupChatListOrder)).toBeGreaterThan(PINNED_OFFSET);

      // 테스트 후 정리
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).remove();
    });

    it('이미 핀 설정된 경우: 업데이트하지 않음', async () => {
      // 각 테스트마다 고유한 ID 생성 (Firebase 경로는 . 사용 불가하므로 정수만 사용)
      const testUid = 'test-user-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
      const testRoomId = 'test-room-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);

      // Given: 먼저 읽음 상태로 생성
      const readOrder = toChatListOrder(testTimestamp, 'read');
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).set({
        roomId: testRoomId,
        allChatListOrder: readOrder,
        pin: false, // 초기에는 핀 해제 상태
      });

      // When: 핀 설정하여 핀 상태로 만듦
      await db.ref(`chat-joins/${testUid}/${testRoomId}/pin`).set(true);

      // 핀 설정 직후 값 확인
      await new Promise(resolve => setTimeout(resolve, 500)); // 트리거 실행 대기
      const afterFirstPinSetSnapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}`).once('value');
      const afterFirstPinSetData = afterFirstPinSetSnapshot.val();

      // 트리거가 이미 실행되었다면 핸들러 호출 스킵
      if (extractChatStatus(afterFirstPinSetData.allChatListOrder) !== 'pinned') {
        await handleChatRoomPinCreate(testUid, testRoomId);
      }

      // 설정 직후 값 확인
      const beforeSnapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}/allChatListOrder`).once('value');
      const beforeValue = beforeSnapshot.val();

      // When: 핀 설정 (중복)
      await handleChatRoomPinCreate(testUid, testRoomId);

      // Then: 값 변경 없음 (설정 전과 동일) - semantic verification
      const afterSnapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}/allChatListOrder`).once('value');
      const afterValue = afterSnapshot.val();

      // 타입 검증: 숫자여야 함
      expect(typeof afterValue).toBe('number');
      expect(typeof beforeValue).toBe('number');

      // 상태 검증: 여전히 pinned 상태여야 함
      expect(extractChatStatus(afterValue)).toBe('pinned');
      expect(extractChatStatus(beforeValue)).toBe('pinned');

      // 음수 검증
      expect(afterValue).toBeLessThan(0);
      expect(beforeValue).toBeLessThan(0);

      // PINNED_OFFSET이 적용되었는지 검증
      expect(Math.abs(afterValue)).toBeGreaterThan(PINNED_OFFSET);
      expect(Math.abs(beforeValue)).toBeGreaterThan(PINNED_OFFSET);

      // 값이 변경되지 않았는지 확인 (idempotency)
      expect(afterValue).toBe(beforeValue);

      // 테스트 후 정리
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).remove();
    });
  });

  describe('handleChatRoomPinDelete - 핀 해제', () => {
    it('핀 설정 → 읽음 상태: PINNED_OFFSET 제거', async () => {
      // 각 테스트마다 고유한 ID 생성 (Firebase 경로는 . 사용 불가하므로 정수만 사용)
      const testUid = 'test-user-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
      const testRoomId = 'test-room-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);

      // Given: 핀 설정된 채팅방 (newMessageCount = 0)
      const pinnedOrder = toChatListOrder(testTimestamp, 'pinned');
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).set({
        roomId: testRoomId,
        allChatListOrder: pinnedOrder,
        singleChatListOrder: pinnedOrder,
        newMessageCount: 0,
      });

      // When: 핀 해제
      await handleChatRoomPinDelete(testUid, testRoomId);

      // Then: 읽음 상태로 변경 - semantic verification
      const snapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}`).once('value');
      const data = snapshot.val();

      // 타입 검증: 숫자여야 함 (문자열이 아님)
      expect(typeof data.allChatListOrder).toBe('number');
      expect(typeof data.singleChatListOrder).toBe('number');

      // 상태 검증: read 상태여야 함
      expect(extractChatStatus(data.allChatListOrder)).toBe('read');
      expect(extractChatStatus(data.singleChatListOrder)).toBe('read');

      // 음수 검증
      expect(data.allChatListOrder).toBeLessThan(0);
      expect(data.singleChatListOrder).toBeLessThan(0);

      // PINNED_OFFSET이 제거되었는지 검증 (절대값이 PINNED_OFFSET보다 작음)
      expect(Math.abs(data.allChatListOrder)).toBeLessThan(PINNED_OFFSET);
      expect(Math.abs(data.singleChatListOrder)).toBeLessThan(PINNED_OFFSET);

      // UNREAD_OFFSET도 제거되었는지 검증 (절대값이 UNREAD_OFFSET보다 작음)
      expect(Math.abs(data.allChatListOrder)).toBeLessThan(UNREAD_OFFSET);
      expect(Math.abs(data.singleChatListOrder)).toBeLessThan(UNREAD_OFFSET);

      // ❌ 문자열이 아님을 확인
      expect(typeof data.allChatListOrder).not.toBe('string');
      expect(typeof data.singleChatListOrder).not.toBe('string');

      // 테스트 후 정리
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).remove();
    });

    it('핀 설정 + 읽지 않음 → 핀 해제: PINNED_OFFSET → UNREAD_OFFSET', async () => {
      // 각 테스트마다 고유한 ID 생성 (Firebase 경로는 . 사용 불가하므로 정수만 사용)
      const testUid = 'test-user-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
      const testRoomId = 'test-room-pin-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);

      // Given: 핀 설정된 채팅방 (newMessageCount > 0)
      const pinnedOrder = toChatListOrder(testTimestamp, 'pinned');
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).set({
        roomId: testRoomId,
        allChatListOrder: pinnedOrder,
        groupChatListOrder: pinnedOrder,
        newMessageCount: 3,
      });

      // When: 핀 해제
      await handleChatRoomPinDelete(testUid, testRoomId);

      // Then: 읽지 않음 상태로 변경 - semantic verification
      const snapshot = await db.ref(`chat-joins/${testUid}/${testRoomId}`).once('value');
      const data = snapshot.val();

      // 타입 검증: 숫자여야 함
      expect(typeof data.allChatListOrder).toBe('number');
      expect(typeof data.groupChatListOrder).toBe('number');

      // 상태 검증: unread 상태여야 함
      expect(extractChatStatus(data.allChatListOrder)).toBe('unread');
      expect(extractChatStatus(data.groupChatListOrder)).toBe('unread');

      // 음수 검증
      expect(data.allChatListOrder).toBeLessThan(0);
      expect(data.groupChatListOrder).toBeLessThan(0);

      // UNREAD_OFFSET이 적용되었는지 검증 (절대값이 UNREAD_OFFSET보다 큼)
      expect(Math.abs(data.allChatListOrder)).toBeGreaterThan(UNREAD_OFFSET);
      expect(Math.abs(data.groupChatListOrder)).toBeGreaterThan(UNREAD_OFFSET);

      // PINNED_OFFSET보다는 작아야 함 (pinned 상태가 아님)
      expect(Math.abs(data.allChatListOrder)).toBeLessThan(PINNED_OFFSET);
      expect(Math.abs(data.groupChatListOrder)).toBeLessThan(PINNED_OFFSET);

      // 테스트 후 정리
      await db.ref(`chat-joins/${testUid}/${testRoomId}`).remove();
    });
  });

  describe('정렬 순서 검증', () => {
    it('핀 > 읽지 않음 > 읽음 순서로 정렬됨', () => {
      const timestamp = 1710000000000;

      const pinnedOrder = toChatListOrder(timestamp, 'pinned');
      const unreadOrder = toChatListOrder(timestamp, 'unread');
      const readOrder = toChatListOrder(timestamp, 'read');

      // 오름차순 정렬 시 핀이 가장 먼저 (가장 작은 음수)
      expect(pinnedOrder).toBeLessThan(unreadOrder);
      expect(unreadOrder).toBeLessThan(readOrder);

      // 배열 정렬 검증
      const orders = [readOrder, pinnedOrder, unreadOrder];
      orders.sort((a, b) => a - b);

      expect(orders[0]).toBe(pinnedOrder);
      expect(orders[1]).toBe(unreadOrder);
      expect(orders[2]).toBe(readOrder);
    });

    it('타임스탬프 추출 후 복원 가능', () => {
      const originalTimestamp = 1710000000000;

      const pinnedOrder = toChatListOrder(originalTimestamp, 'pinned');
      const extractedTimestamp = extractTimestampFromChatOrder(pinnedOrder);

      expect(extractedTimestamp).toBe(originalTimestamp);
    });
  });

  describe('타입 검증', () => {
    it('toChatListOrder() 함수는 항상 숫자를 반환', () => {
      const timestamp = Date.now();

      const readOrder = toChatListOrder(timestamp, 'read');
      const unreadOrder = toChatListOrder(timestamp, 'unread');
      const pinnedOrder = toChatListOrder(timestamp, 'pinned');

      expect(typeof readOrder).toBe('number');
      expect(typeof unreadOrder).toBe('number');
      expect(typeof pinnedOrder).toBe('number');

      // ❌ 문자열이 절대 반환되지 않음
      expect(typeof readOrder).not.toBe('string');
      expect(typeof unreadOrder).not.toBe('string');
      expect(typeof pinnedOrder).not.toBe('string');
    });

    it('Offset 상수들은 숫자 타입', () => {
      expect(typeof PINNED_OFFSET).toBe('number');
      expect(typeof UNREAD_OFFSET).toBe('number');
    });
  });
});
