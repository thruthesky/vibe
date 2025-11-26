import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getVertexAI, getGenerativeModel } from "@firebase/vertexai";

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
export const vertexAI = getVertexAI(app, { location: "asia-northeast3" });
export const model = getGenerativeModel(vertexAI, { model: "gemini-2.5-flash-lite" });
