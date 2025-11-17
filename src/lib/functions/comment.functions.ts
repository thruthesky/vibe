/**
 * 댓글 관련 클라이언트 함수
 *
 * 이 파일은 Firebase Realtime Database와 상호작용하여
 * 댓글 생성, 수정, 삭제, 조회 기능을 제공합니다.
 */

import { rtdb } from '$lib/firebase';
import { ref, push, update, get, query, orderByChild, limitToLast } from 'firebase/database';
import { generateThreadOrder, getDepthFromListOrder } from '../../../shared/thread-order';
import type {
  ChatMessageComment,
  CreateCommentPayload,
  CommentWithMetadata
} from '$lib/types/comment.types';

/**
 * 새로운 댓글을 생성합니다.
 *
 * @param messageId - 게시글(채팅 메시지) ID
 * @param text - 댓글 내용
 * @param authorUid - 댓글 작성자 UID
 * @param urls - 첨부 파일 URL 목록 (선택적)
 * @param parentId - 부모 댓글 ID (최상위 댓글인 경우 null)
 * @returns 생성 결과 (성공 여부, 댓글 ID, 에러 메시지)
 */
export async function createComment(
  messageId: string,
  text: string,
  authorUid: string,
  urls?: Record<number, string>,
  parentId?: string | null
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  if (!rtdb) {
    return { success: false, error: 'Firebase RTDB가 초기화되지 않았습니다.' };
  }

  if (!messageId || !text.trim() || !authorUid) {
    return { success: false, error: '필수 입력값이 누락되었습니다.' };
  }

  try {
    // 1. 부모의 listOrder와 childCount 가져오기
    let parentListOrder: string | null = null;
    let parentChildCount = 0;

    if (parentId) {
      // 대댓글인 경우: 부모 댓글의 정보 읽기
      const parentRef = ref(rtdb, `chat-message-comments/${messageId}/${parentId}`);
      const parentSnapshot = await get(parentRef);

      if (!parentSnapshot.exists()) {
        return { success: false, error: '부모 댓글을 찾을 수 없습니다.' };
      }

      const parentData = parentSnapshot.val() as ChatMessageComment;
      parentListOrder = parentData.listOrder;
      parentChildCount = parentData.childCount || 0;
    } else {
      // 최상위 댓글인 경우: 메시지의 childCount 읽기
      const messageRef = ref(rtdb, `chat-messages/${messageId}/childCount`);
      const messageSnapshot = await get(messageRef);

      if (messageSnapshot.exists()) {
        parentChildCount = messageSnapshot.val() as number;
      }
    }

    // 2. 새로운 listOrder 생성 (childCount 기반)
    const newListOrder = generateThreadOrder(parentListOrder, parentChildCount);

    // 3. 댓글 데이터 생성
    const payload: CreateCommentPayload = {
      text: text.trim(),
      authorUid,
      parentId: parentId || null,
      createdAt: Date.now(),
      listOrder: newListOrder
    };

    // 첨부 파일이 있으면 추가
    if (urls && Object.keys(urls).length > 0) {
      payload.urls = urls;
    }

    // 4. Firebase RTDB에 댓글 저장
    const newCommentRef = push(ref(rtdb, `chat-message-comments/${messageId}`));
    await update(newCommentRef, payload);

    return {
      success: true,
      commentId: newCommentRef.key || undefined
    };
  } catch (error) {
    console.error('댓글 생성 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글 생성에 실패했습니다.'
    };
  }
}

/**
 * 특정 게시글의 모든 댓글을 listOrder 순서로 로드합니다.
 *
 * @param messageId - 게시글(채팅 메시지) ID
 * @returns 댓글 목록 (메타데이터 포함)
 */
export async function loadComments(
  messageId: string
): Promise<{ success: boolean; comments?: CommentWithMetadata[]; error?: string }> {
  if (!rtdb) {
    return { success: false, error: 'Firebase RTDB가 초기화되지 않았습니다.' };
  }

  if (!messageId) {
    return { success: false, error: '게시글 ID가 필요합니다.' };
  }

  try {
    // listOrder 순서로 댓글 가져오기
    const commentsRef = ref(rtdb, `chat-message-comments/${messageId}`);
    const commentsQuery = query(commentsRef, orderByChild('listOrder'));
    const snapshot = await get(commentsQuery);

    if (!snapshot.exists()) {
      return { success: true, comments: [] };
    }

    const comments: CommentWithMetadata[] = [];
    snapshot.forEach((child) => {
      const comment = child.val() as ChatMessageComment;
      const commentId = child.key || '';

      // 깊이(depth) 계산
      const depth = getDepthFromListOrder(comment.listOrder);

      comments.push({
        ...comment,
        commentId,
        depth
      });
    });

    return { success: true, comments };
  } catch (error) {
    console.error('댓글 로드 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글 로드에 실패했습니다.'
    };
  }
}

/**
 * 특정 게시글의 마지막 N개 댓글을 listOrder 순서로 로드합니다.
 * 글 목록 페이지에서 댓글 미리보기용으로 사용합니다.
 *
 * @param messageId - 게시글(채팅 메시지) ID
 * @param limit - 가져올 댓글 개수 (기본값: 3)
 * @returns 댓글 목록 (메타데이터 포함)
 */
export async function loadLastComments(
  messageId: string,
  limit: number = 3
): Promise<{ success: boolean; comments?: CommentWithMetadata[]; error?: string }> {
  if (!rtdb) {
    return { success: false, error: 'Firebase RTDB가 초기화되지 않았습니다.' };
  }

  if (!messageId) {
    return { success: false, error: '게시글 ID가 필요합니다.' };
  }

  try {
    // listOrder 순서로 마지막 N개 댓글 가져오기
    const commentsRef = ref(rtdb, `chat-message-comments/${messageId}`);
    const commentsQuery = query(commentsRef, orderByChild('listOrder'), limitToLast(limit));
    const snapshot = await get(commentsQuery);

    if (!snapshot.exists()) {
      return { success: true, comments: [] };
    }

    const comments: CommentWithMetadata[] = [];
    snapshot.forEach((child) => {
      const comment = child.val() as ChatMessageComment;
      const commentId = child.key || '';

      // 깊이(depth) 계산
      const depth = getDepthFromListOrder(comment.listOrder);

      comments.push({
        ...comment,
        commentId,
        depth
      });
    });

    return { success: true, comments };
  } catch (error) {
    console.error('마지막 댓글 로드 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글 로드에 실패했습니다.'
    };
  }
}

/**
 * 댓글을 수정합니다.
 *
 * @param messageId - 게시글(채팅 메시지) ID
 * @param commentId - 댓글 ID
 * @param text - 수정할 댓글 내용
 * @param urls - 수정할 첨부 파일 URL 목록 (선택적)
 * @returns 수정 결과
 */
export async function updateComment(
  messageId: string,
  commentId: string,
  text: string,
  urls?: Record<number, string>
): Promise<{ success: boolean; error?: string }> {
  if (!rtdb) {
    return { success: false, error: 'Firebase RTDB가 초기화되지 않았습니다.' };
  }

  if (!messageId || !commentId || !text.trim()) {
    return { success: false, error: '필수 입력값이 누락되었습니다.' };
  }

  try {
    const commentRef = ref(rtdb, `chat-message-comments/${messageId}/${commentId}`);
    const updates: Partial<ChatMessageComment> = {
      text: text.trim(),
      editedAt: Date.now()
    };

    if (urls) {
      updates.urls = urls;
    }

    await update(commentRef, updates);

    return { success: true };
  } catch (error) {
    console.error('댓글 수정 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글 수정에 실패했습니다.'
    };
  }
}

/**
 * 댓글을 삭제합니다 (Soft Delete).
 *
 * @param messageId - 게시글(채팅 메시지) ID
 * @param commentId - 댓글 ID
 * @returns 삭제 결과
 */
export async function deleteComment(
  messageId: string,
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!rtdb) {
    return { success: false, error: 'Firebase RTDB가 초기화되지 않았습니다.' };
  }

  if (!messageId || !commentId) {
    return { success: false, error: '필수 입력값이 누락되었습니다.' };
  }

  try {
    const commentRef = ref(rtdb, `chat-message-comments/${messageId}/${commentId}`);

    // Soft Delete: deleted 필드를 true로 설정, 내용은 초기화
    const updates: Partial<ChatMessageComment> = {
      deleted: true,
      deletedAt: Date.now(),
      text: '',
      urls: undefined
    };

    await update(commentRef, updates);

    return { success: true };
  } catch (error) {
    console.error('댓글 삭제 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글 삭제에 실패했습니다.'
    };
  }
}
