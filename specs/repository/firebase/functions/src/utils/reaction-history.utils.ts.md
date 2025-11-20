---
title: reaction-history.utils.ts - TypeScript 소스 코드
original_path: firebase/functions/src/utils/reaction-history.utils.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# reaction-history.utils.ts

## 개요

**원본 경로**: `firebase/functions/src/utils/reaction-history.utils.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 리액션 히스토리 관련 유틸리티 함수
 *
 * 사용자의 모든 활동(좋아요, 게시글 작성, 댓글 작성, 팔로우)을 기록하고,
 * 다른 사용자로부터 받은 반응을 추적합니다.
 *
 * 데이터 구조:
 * - /my-actions/{uid}/{pushKey}: 내가 발생시킨 리액션 기록
 * - /received-reactions/{uid}/{pushKey}: 다른 사용자로부터 받은 리액션 기록
 */

import * as admin from 'firebase-admin';

/**
 * 리액션 타입
 */
export type ReactionType = 'like' | 'post' | 'comment' | 'follow';

/**
 * 리액션 대상 타입
 */
export type TargetType = 'post' | 'comment' | 'user';

/**
 * 리액션 레코드 인터페이스
 */
export interface ReactionRecord {
  fromUid: string;      // 리액션 발생자 UID
  type: ReactionType;   // 리액션 유형
  targetType: TargetType; // 대상 타입
  targetId: string;     // 대상 ID
  postId?: string;      // (선택) 댓글인 경우 게시글 ID
  createdAt: number;    // Unix timestamp (ms)
}

/**
 * 나의 발자취에 리액션 기록
 *
 * @param params 리액션 파라미터
 * @param params.uid 사용자 UID
 * @param params.type 리액션 유형
 * @param params.targetType 대상 타입
 * @param params.targetId 대상 ID
 * @param params.postId (선택) 댓글인 경우 게시글 ID
 * @returns Promise<void>
 */
export async function recordMyAction(params: {
  uid: string;
  type: ReactionType;
  targetType: TargetType;
  targetId: string;
  postId?: string;
}): Promise<void> {
  const { uid, type, targetType, targetId, postId } = params;

  console.log('[recordMyAction] 나의 발자취 기록 시작:', {
    uid,
    type,
    targetType,
    targetId,
    postId
  });

  const record: ReactionRecord = {
    fromUid: uid,
    type,
    targetType,
    targetId,
    createdAt: Date.now()
  };

  // 댓글인 경우 postId 추가
  if (targetType === 'comment' && postId) {
    record.postId = postId;
  }

  try {
    const myActionsRef = admin.database().ref(`my-actions/${uid}`);
    await myActionsRef.push(record);

    console.log('[recordMyAction] ✅ 나의 발자취 기록 완료:', record);
  } catch (error) {
    console.error('[recordMyAction] ❌ 나의 발자취 기록 실패:', error);
    throw error;
  }
}

/**
 * 받은 반응에 리액션 기록
 *
 * ⚠️ 중요: 자기 자신의 리액션은 기록하지 않음
 *
 * @param params 리액션 파라미터
 * @param params.recipientUid 반응을 받은 사용자 UID
 * @param params.fromUid 리액션 발생자 UID
 * @param params.type 리액션 유형
 * @param params.targetType 대상 타입
 * @param params.targetId 대상 ID
 * @param params.postId (선택) 댓글인 경우 게시글 ID
 * @returns Promise<void>
 */
export async function recordReceivedReaction(params: {
  recipientUid: string;
  fromUid: string;
  type: ReactionType;
  targetType: TargetType;
  targetId: string;
  postId?: string;
}): Promise<void> {
  const { recipientUid, fromUid, type, targetType, targetId, postId } = params;

  // ⚠️ 자기 자신의 리액션은 받은 반응에 기록하지 않음
  if (recipientUid === fromUid) {
    console.log('[recordReceivedReaction] ⏭️ 자기 자신의 리액션은 받은 반응에 기록하지 않음:', {
      recipientUid,
      fromUid
    });
    return;
  }

  console.log('[recordReceivedReaction] 받은 반응 기록 시작:', {
    recipientUid,
    fromUid,
    type,
    targetType,
    targetId,
    postId
  });

  const record: ReactionRecord = {
    fromUid,
    type,
    targetType,
    targetId,
    createdAt: Date.now()
  };

  // 댓글인 경우 postId 추가
  if (targetType === 'comment' && postId) {
    record.postId = postId;
  }

  try {
    const receivedReactionsRef = admin.database().ref(`received-reactions/${recipientUid}`);
    await receivedReactionsRef.push(record);

    console.log('[recordReceivedReaction] ✅ 받은 반응 기록 완료:', record);
  } catch (error) {
    console.error('[recordReceivedReaction] ❌ 받은 반응 기록 실패:', error);
    throw error;
  }
}

/**
 * 나의 발자취에서 리액션 삭제
 *
 * targetId와 type을 기준으로 해당 기록을 찾아서 삭제합니다.
 *
 * @param params 삭제 파라미터
 * @param params.uid 사용자 UID
 * @param params.type 리액션 유형
 * @param params.targetId 대상 ID
 * @returns Promise<void>
 */
export async function deleteMyAction(params: {
  uid: string;
  type: 'like' | 'follow';
  targetId: string;
}): Promise<void> {
  const { uid, type, targetId } = params;

  console.log('[deleteMyAction] 나의 발자취 삭제 시작:', {
    uid,
    type,
    targetId
  });

  try {
    const myActionsRef = admin.database().ref(`my-actions/${uid}`);

    // type과 targetId가 일치하는 기록 찾기
    const snapshot = await myActionsRef
      .orderByChild('type')
      .equalTo(type)
      .once('value');

    if (!snapshot.exists()) {
      console.log('[deleteMyAction] ⏭️ 삭제할 기록이 없음');
      return;
    }

    const updates: { [key: string]: null } = {};
    snapshot.forEach((child: admin.database.DataSnapshot) => {
      const record = child.val() as ReactionRecord;
      if (record.targetId === targetId) {
        updates[child.key!] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await myActionsRef.update(updates);
      console.log('[deleteMyAction] ✅ 나의 발자취 삭제 완료:', {
        deletedCount: Object.keys(updates).length
      });
    } else {
      console.log('[deleteMyAction] ⏭️ 일치하는 targetId 없음');
    }
  } catch (error) {
    console.error('[deleteMyAction] ❌ 나의 발자취 삭제 실패:', error);
    throw error;
  }
}

/**
 * 받은 반응에서 리액션 삭제
 *
 * fromUid, type, targetId를 기준으로 해당 기록을 찾아서 삭제합니다.
 *
 * @param params 삭제 파라미터
 * @param params.recipientUid 반응을 받은 사용자 UID
 * @param params.fromUid 리액션 발생자 UID
 * @param params.type 리액션 유형
 * @param params.targetId 대상 ID
 * @returns Promise<void>
 */
export async function deleteReceivedReaction(params: {
  recipientUid: string;
  fromUid: string;
  type: 'like' | 'follow';
  targetId: string;
}): Promise<void> {
  const { recipientUid, fromUid, type, targetId } = params;

  // ⚠️ 자기 자신의 리액션은 받은 반응에 기록되지 않았으므로 삭제할 필요 없음
  if (recipientUid === fromUid) {
    console.log('[deleteReceivedReaction] ⏭️ 자기 자신의 리액션은 삭제 불필요');
    return;
  }

  console.log('[deleteReceivedReaction] 받은 반응 삭제 시작:', {
    recipientUid,
    fromUid,
    type,
    targetId
  });

  try {
    const receivedReactionsRef = admin.database().ref(`received-reactions/${recipientUid}`);

    // fromUid가 일치하는 기록 찾기
    const snapshot = await receivedReactionsRef
      .orderByChild('fromUid')
      .equalTo(fromUid)
      .once('value');

    if (!snapshot.exists()) {
      console.log('[deleteReceivedReaction] ⏭️ 삭제할 기록이 없음');
      return;
    }

    const updates: { [key: string]: null } = {};
    snapshot.forEach((child: admin.database.DataSnapshot) => {
      const record = child.val() as ReactionRecord;
      if (record.type === type && record.targetId === targetId) {
        updates[child.key!] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await receivedReactionsRef.update(updates);
      console.log('[deleteReceivedReaction] ✅ 받은 반응 삭제 완료:', {
        deletedCount: Object.keys(updates).length
      });
    } else {
      console.log('[deleteReceivedReaction] ⏭️ 일치하는 type/targetId 없음');
    }
  } catch (error) {
    console.error('[deleteReceivedReaction] ❌ 받은 반응 삭제 실패:', error);
    throw error;
  }
}

/**
 * targetType 값에서 실제 타입 추출
 *
 * 'post', 'comment', 'comment-{postId}', 'chat-message-{roomId}' 등의 값에서
 * 실제 타입('post', 'comment', 'user')을 추출합니다.
 *
 * @param value targetType 값
 * @returns TargetType
 */
export function getTargetTypeFromValue(value: string): TargetType {
  if (value === 'post') return 'post';
  if (value === 'comment' || value.startsWith('comment-')) return 'comment';
  if (value === 'user') return 'user';

  // 기본값: post (채팅 메시지 등)
  return 'post';
}

/**
 * 게시글/댓글의 작성자 UID 조회
 *
 * @param targetType 대상 타입 문자열 ('post', 'comment', 'comment-{postId}')
 * @param targetId 대상 ID (postId 또는 commentId)
 * @returns Promise<string | null> 작성자 UID 또는 null
 */
export async function getContentAuthorUid(
  targetType: string,
  targetId: string
): Promise<string | null> {
  try {
    // targetType이 'comment-{postId}' 형식인 경우 postId 추출
    let postId: string | null = null;
    if (targetType.startsWith('comment-')) {
      postId = targetType.substring(8); // 'comment-' 이후 부분이 postId
    }

    if (targetType === 'post') {
      // 게시글 작성자 조회
      const postSnapshot = await admin.database().ref(`posts/${targetId}/authorUid`).once('value');
      return postSnapshot.val();
    } else if (targetType === 'comment' || targetType.startsWith('comment-')) {
      // 댓글 작성자 조회
      if (!postId) {
        console.error('[getContentAuthorUid] ❌ postId를 찾을 수 없음:', targetType);
        return null;
      }

      const commentSnapshot = await admin.database()
        .ref(`comments/${postId}/${targetId}/authorUid`)
        .once('value');
      return commentSnapshot.val();
    }

    return null;
  } catch (error) {
    console.error('[getContentAuthorUid] ❌ 작성자 UID 조회 실패:', error);
    return null;
  }
}
```
