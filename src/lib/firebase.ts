import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: "AIzaSyDHTpyT6DnBXhrD5pe-ZN9tOl0SChIyBds",
  authDomain: "withcenter-test-5.firebaseapp.com",
  databaseURL: "https://withcenter-test-5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "withcenter-test-5",
  storageBucket: "withcenter-test-5.appspot.com",
  messagingSenderId: "1064417466216",
  appId: "1:1064417466216:web:b6299581a9432ea5db28dd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firebase AI Logic 초기화 (Gemini Developer API 백엔드 사용)
const ai = getAI(app, { backend: new GoogleAIBackend() });

// 시스템 명령어 - AI가 HTML 앱을 생성하도록 지시
const systemInstruction = `당신은 자바스크립트 전문 개발자입니다. 하나의 HTML 페이지에 CSS, JavaScript를 모두 포함하여, 사용자가 요청하는 앱을 현대적이며 화려한 디자인으로 만들어서 JSON 형식으로 제공해주세요.

응답 형식:
{
  "html": "<!DOCTYPE html><html>...</html>"
}

중요: 반드시 위 JSON 형식으로만 응답하고, 다른 설명은 추가하지 마세요.`;

// Gemini 모델 생성 (systemInstruction은 모델 생성 시 설정해야 함)
export const model = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-lite",
  systemInstruction: systemInstruction
});
