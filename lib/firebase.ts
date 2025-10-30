// Firebase 초기화 및 서비스 설정
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase 설정 정보
// Firebase Console에서 프로젝트 설정 > 앱 추가 > 웹 에서 설정 정보를 복사하세요
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const rtdb: Database = getDatabase(app); // Realtime Database
export const storage: FirebaseStorage = getStorage(app); // Firebase Storage

export default app;
