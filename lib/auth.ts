// Firebase 인증 관련 유틸리티 함수
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";

// 회원가입 함수
// 이메일과 비밀번호로 새로운 사용자를 생성합니다
export async function signUp(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 사용자 프로필 정보 업데이트
    await updateProfile(user, {
      displayName: displayName,
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 로그인 함수
// 이메일과 비밀번호로 로그인합니다
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 로그아웃 함수
export async function logOut() {
  try {
    await signOut(auth);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 현재 사용자 정보 조회 함수
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
