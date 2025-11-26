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

// 시스템 명령어 - AI가 순수 HTML 앱을 생성하도록 지시
const systemInstruction = `당신은 자바스크립트 전문 개발자입니다. 하나의 HTML 페이지에 CSS, JavaScript를 모두 포함하여, 사용자가 요청하는 앱을 현대적이며 화려한 디자인으로 만들어주세요.

응답 규칙:
1. <!DOCTYPE html>로 시작하고 </html>로 끝나는 완전한 HTML 문서만 반환하세요.
2. JSON 형식으로 감싸지 마세요.
3. 마크다운 코드 블록(\`\`\`)으로 감싸지 마세요.
4. HTML 코드 전후에 어떤 설명도 추가하지 마세요.
5. 순수 HTML 코드만 반환하세요.`;

// Gemini 모델 생성 (systemInstruction은 모델 생성 시 설정해야 함)
export const model = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-lite",
  systemInstruction: systemInstruction
});
