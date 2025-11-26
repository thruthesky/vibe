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

// Initialize the Gemini Developer API backend service (AI Logic)
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create a GenerativeModel instance
export const model = getGenerativeModel(ai, { model: "gemini-2.5-flash-lite" });
