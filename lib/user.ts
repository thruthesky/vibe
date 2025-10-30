// Firebase Realtime Database (RTDB)를 사용한 사용자 정보 관리 함수들

import { rtdb } from "./firebase";
import { ref, set, get } from "firebase/database";
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
