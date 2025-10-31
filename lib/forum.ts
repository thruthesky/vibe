// 게시판 관련 함수
// Firebase Realtime Database를 사용하여 게시글 CRUD 기능을 제공합니다.
// docs/forum.md의 데이터 구조를 따릅니다.

import { rtdb } from "./firebase";
import { ref, push, set, query, orderByChild, limitToLast, onValue, get } from "firebase/database";

// 루트 폴더 상수 (모든 데이터는 이 폴더 아래에 저장됩니다)
const ROOT_FOLDER = "vibe";

// 게시글 인터페이스
export interface ForumPost {
  postId?: string; // Firebase에서 자동 생성되는 ID
  uid: string; // 글 작성자 UID
  title: string; // 게시글 제목
  content: string; // 게시글 내용
  author: string; // 작성자 이름
  category: string; // 게시판 카테고리 (community, qna, news, market)
  createdAt: number; // 작성일 (Unix timestamp)
  updatedAt: number; // 수정일 (Unix timestamp)
}

/**
 * 게시글 생성
 * @param category - 게시판 카테고리 (community, qna, news, market)
 * @param uid - 작성자 UID
 * @param author - 작성자 이름
 * @param title - 게시글 제목
 * @param content - 게시글 내용
 * @returns 성공 여부와 생성된 게시글 ID
 */
export async function createPost(
  category: string,
  uid: string,
  author: string,
  title: string,
  content: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // 게시글 데이터 경로: /vibe/forums/{category}/posts
    const postsRef = ref(rtdb, `${ROOT_FOLDER}/forums/${category}/posts`);

    // 새 게시글 참조 생성 (Firebase가 자동으로 고유 ID 생성)
    const newPostRef = push(postsRef);

    // 현재 시간 (Unix timestamp)
    const timestamp = Date.now();

    // 게시글 데이터
    const postData: ForumPost = {
      uid,
      title,
      content,
      author,
      category,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // 데이터 저장
    await set(newPostRef, postData);

    return {
      success: true,
      postId: newPostRef.key || undefined,
    };
  } catch (error) {
    console.error("게시글 생성 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 게시글 목록 조회 (최근 N개)
 * @param category - 게시판 카테고리
 * @param limit - 조회할 게시글 수 (기본값: 10)
 * @returns 게시글 배열
 */
export async function getPosts(
  category: string,
  limit: number = 10
): Promise<ForumPost[]> {
  try {
    // 게시글 데이터 경로: /vibe/forums/{category}/posts
    const postsRef = ref(rtdb, `${ROOT_FOLDER}/forums/${category}/posts`);

    // createdAt 기준으로 내림차순 정렬하여 최근 N개 조회
    const postsQuery = query(
      postsRef,
      orderByChild("createdAt"),
      limitToLast(limit)
    );

    const snapshot = await get(postsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    // 데이터를 배열로 변환
    const posts: ForumPost[] = [];
    snapshot.forEach((childSnapshot) => {
      const post = childSnapshot.val() as ForumPost;
      post.postId = childSnapshot.key || undefined;
      posts.push(post);
    });

    // 최신 글이 위로 오도록 역순 정렬
    return posts.reverse();
  } catch (error) {
    console.error("게시글 목록 조회 오류:", error);
    return [];
  }
}

/**
 * 게시글 목록 실시간 리스너
 * @param category - 게시판 카테고리
 * @param limit - 조회할 게시글 수 (기본값: 10)
 * @param callback - 데이터 변경 시 호출될 콜백 함수
 * @returns unsubscribe 함수 (리스너 해제용)
 */
export function listenToPosts(
  category: string,
  limit: number = 10,
  callback: (posts: ForumPost[]) => void
): () => void {
  // 게시글 데이터 경로: /vibe/forums/{category}/posts
  const postsRef = ref(rtdb, `${ROOT_FOLDER}/forums/${category}/posts`);

  // createdAt 기준으로 내림차순 정렬하여 최근 N개 조회
  const postsQuery = query(
    postsRef,
    orderByChild("createdAt"),
    limitToLast(limit)
  );

  // 실시간 리스너 설정
  const unsubscribe = onValue(postsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    // 데이터를 배열로 변환
    const posts: ForumPost[] = [];
    snapshot.forEach((childSnapshot) => {
      const post = childSnapshot.val() as ForumPost;
      post.postId = childSnapshot.key || undefined;
      posts.push(post);
    });

    // 최신 글이 위로 오도록 역순 정렬
    callback(posts.reverse());
  });

  // 리스너 해제 함수 반환
  return unsubscribe;
}

/**
 * 게시글 삭제
 * @param category - 게시판 카테고리
 * @param postId - 삭제할 게시글 ID
 * @returns 성공 여부
 */
export async function deletePost(
  category: string,
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 게시글 데이터 경로: /vibe/forums/{category}/posts/{postId}
    const postRef = ref(rtdb, `${ROOT_FOLDER}/forums/${category}/posts/${postId}`);

    // 데이터 삭제
    await set(postRef, null);

    return { success: true };
  } catch (error) {
    console.error("게시글 삭제 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 게시글 수정
 * @param category - 게시판 카테고리
 * @param postId - 수정할 게시글 ID
 * @param title - 새 제목
 * @param content - 새 내용
 * @returns 성공 여부
 */
export async function updatePost(
  category: string,
  postId: string,
  title: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 게시글 데이터 경로: /vibe/forums/{category}/posts/{postId}
    const postRef = ref(rtdb, `${ROOT_FOLDER}/forums/${category}/posts/${postId}`);

    // 현재 시간
    const timestamp = Date.now();

    // 수정할 데이터
    const updates = {
      title,
      content,
      updatedAt: timestamp,
    };

    // 데이터 업데이트
    await set(postRef, updates);

    return { success: true };
  } catch (error) {
    console.error("게시글 수정 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}
