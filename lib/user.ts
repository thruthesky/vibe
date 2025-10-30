// Firebase Realtime Database (RTDB)와 Storage를 사용한 사용자 정보 관리 함수들

import { rtdb, storage } from "./firebase";
import { ref, set, get, onValue, off } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { ROOT_FOLDER } from "@/app/app.config";

/**
 * 사용자의 displayName을 RTDB에 저장합니다.
 * 저장 위치: /{ROOT_FOLDER}/users/<uid>/displayName
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @param displayName - 사용자의 표시 이름
 * @returns 저장 성공 여부를 나타내는 객체
 */
export async function saveUserDisplayName(
  uid: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // RTDB에 사용자 displayName 저장
    // 경로: /{ROOT_FOLDER}/users/<uid>/displayName
    const userRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}/displayName`);
    await set(userRef, displayName);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("displayName 저장 실패:", error);
    return {
      success: false,
      error: error.message || "displayName 저장에 실패했습니다.",
    };
  }
}

/**
 * 사용자의 displayName을 RTDB에서 조회합니다.
 * 조회 위치: /{ROOT_FOLDER}/users/<uid>/displayName
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @returns 저장된 displayName 또는 null
 */
export async function getUserDisplayName(uid: string): Promise<string | null> {
  try {
    // RTDB에서 사용자 displayName 조회
    // 경로: /{ROOT_FOLDER}/users/<uid>/displayName
    const userRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}/displayName`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    return null;
  } catch (error: any) {
    console.error("displayName 조회 실패:", error);
    return null;
  }
}

/**
 * 사용자의 모든 정보를 RTDB에서 조회합니다.
 * 조회 위치: /{ROOT_FOLDER}/users/<uid>
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @returns 저장된 사용자 정보 객체 또는 null
 */
export async function getUserData(
  uid: string
): Promise<{ [key: string]: any } | null> {
  try {
    // RTDB에서 사용자 전체 정보 조회
    // 경로: /{ROOT_FOLDER}/users/<uid>
    const userRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    return null;
  } catch (error: any) {
    console.error("사용자 정보 조회 실패:", error);
    return null;
  }
}

/**
 * 사용자의 전체 정보를 RTDB에 저장합니다.
 * 저장 위치: /{ROOT_FOLDER}/users/<uid>
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @param userData - 저장할 사용자 정보 객체
 * @returns 저장 성공 여부를 나타내는 객체
 */
export async function saveUserData(
  uid: string,
  userData: { [key: string]: any }
): Promise<{ success: boolean; error?: string }> {
  try {
    // RTDB에 사용자 정보 저장
    // 경로: /{ROOT_FOLDER}/users/<uid>
    const userRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}`);
    await set(userRef, userData);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("사용자 정보 저장 실패:", error);
    return {
      success: false,
      error: error.message || "사용자 정보 저장에 실패했습니다.",
    };
  }
}

/**
 * 모든 사용자의 정보를 RTDB에서 조회합니다.
 * 조회 위치: /{ROOT_FOLDER}/users
 *
 * @returns 모든 사용자 정보 객체 또는 null
 *          { uid1: {...}, uid2: {...}, ... } 형태
 */
export async function getAllUsers(): Promise<{
  [uid: string]: any;
} | null> {
  try {
    // RTDB에서 모든 사용자 정보 조회
    // 경로: /{ROOT_FOLDER}/users
    const usersRef = ref(rtdb, `${ROOT_FOLDER}/users`);
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    return null;
  } catch (error: any) {
    console.error("사용자 목록 조회 실패:", error);
    return null;
  }
}

/**
 * 사용자의 프로필 사진을 Firebase Storage에 업로드하고 URL을 RTDB에 저장합니다.
 * 저장 위치:
 *   - Storage: /users/<uid>/profile.jpg (또는 .png 등의 확장자)
 *   - RTDB: /{ROOT_FOLDER}/users/<uid>/photoUrl
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @param file - 업로드할 이미지 파일
 * @returns 업로드 성공 여부 및 photoUrl을 나타내는 객체
 */
export async function uploadProfilePhoto(
  uid: string,
  file: File
): Promise<{ success: boolean; photoUrl?: string; error?: string }> {
  try {
    // 파일 크기 확인 (10MB 이상일 경우 오류)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.",
      };
    }

    // 지원하는 이미지 형식 확인
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 가능)",
      };
    }

    // 파일 확장자 결정
    const extension = file.type.split("/")[1];
    const fileName = `profile.${extension}`;

    // Firebase Storage에 파일 업로드
    // 경로: /users/<uid>/profile.<확장자>
    const uploadRef = storageRef(storage, `users/${uid}/${fileName}`);
    const uploadResult = await uploadBytes(uploadRef, file);

    // 업로드된 파일의 다운로드 URL 획득
    const photoUrl = await getDownloadURL(uploadResult.ref);

    // RTDB에 photoUrl 저장
    // 경로: /{ROOT_FOLDER}/users/<uid>/photoUrl
    const userPhotoRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}/photoUrl`);
    await set(userPhotoRef, photoUrl);

    return {
      success: true,
      photoUrl,
    };
  } catch (error: any) {
    console.error("프로필 사진 업로드 실패:", error);
    return {
      success: false,
      error: error.message || "프로필 사진 업로드에 실패했습니다.",
    };
  }
}

/**
 * 사용자의 프로필 사진 URL을 RTDB에서 조회합니다.
 * 조회 위치: /{ROOT_FOLDER}/users/<uid>/photoUrl
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @returns 저장된 photoUrl 또는 null
 */
export async function getUserPhotoUrl(uid: string): Promise<string | null> {
  try {
    // RTDB에서 사용자 photoUrl 조회
    // 경로: /{ROOT_FOLDER}/users/<uid>/photoUrl
    const userPhotoRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}/photoUrl`);
    const snapshot = await get(userPhotoRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    return null;
  } catch (error: any) {
    console.error("프로필 사진 URL 조회 실패:", error);
    return null;
  }
}

/**
 * 사용자의 displayName을 RTDB에서 실시간으로 감시합니다.
 * displayName이 변경되면 callback 함수가 실행됩니다.
 * 조회 위치: /{ROOT_FOLDER}/users/<uid>/displayName
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @param callback - displayName이 변경될 때마다 실행할 콜백 함수
 * @returns 리스너 해제 함수 (컴포넌트 언마운트 시 호출해야 함)
 */
export function listenToUserDisplayName(
  uid: string,
  callback: (displayName: string | null) => void
): () => void {
  // RTDB에서 사용자 displayName 실시간 감시
  // 경로: /{ROOT_FOLDER}/users/<uid>/displayName
  const userRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}/displayName`);

  const unsubscribe = onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  // 리스너 해제 함수 반환
  return unsubscribe;
}

/**
 * 사용자의 프로필 사진 URL을 RTDB에서 실시간으로 감시합니다.
 * photoUrl이 변경되면 callback 함수가 실행됩니다.
 * 조회 위치: /{ROOT_FOLDER}/users/<uid>/photoUrl
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @param callback - photoUrl이 변경될 때마다 실행할 콜백 함수
 * @returns 리스너 해제 함수 (컴포넌트 언마운트 시 호출해야 함)
 */
export function listenToUserPhotoUrl(
  uid: string,
  callback: (photoUrl: string | null) => void
): () => void {
  // RTDB에서 사용자 photoUrl 실시간 감시
  // 경로: /{ROOT_FOLDER}/users/<uid>/photoUrl
  const userPhotoRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}/photoUrl`);

  const unsubscribe = onValue(userPhotoRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  // 리스너 해제 함수 반환
  return unsubscribe;
}

/**
 * 사용자의 전체 정보를 RTDB에서 실시간으로 감시합니다.
 * 사용자 정보가 변경되면 callback 함수가 실행됩니다.
 * 조회 위치: /{ROOT_FOLDER}/users/<uid>
 *
 * @param uid - 사용자의 고유 ID (Firebase UID)
 * @param callback - 사용자 정보가 변경될 때마다 실행할 콜백 함수
 * @returns 리스너 해제 함수 (컴포넌트 언마운트 시 호출해야 함)
 */
export function listenToUserData(
  uid: string,
  callback: (userData: { [key: string]: any } | null) => void
): () => void {
  // RTDB에서 사용자 전체 정보 실시간 감시
  // 경로: /{ROOT_FOLDER}/users/<uid>
  const userRef = ref(rtdb, `${ROOT_FOLDER}/users/${uid}`);

  const unsubscribe = onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  // 리스너 해제 함수 반환
  return unsubscribe;
}
