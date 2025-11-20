/**
 * 테스트 사용자를 생성하는 스크립트
 * https://firebase.google.com/docs/auth/admin/manage-users#create_a_user
 */

import { getAuth } from "firebase-admin/auth";

// Firebase Admin SDK 초기화
import { initializeApp } from "firebase-admin/app";
initializeApp();

const users = [
  { email: "chrome@test.com", number: "+11234567001" },
  { email: "canary@test.com", number: "+11234567002" },
  { email: "opera@test.com", number: "+11234567003" },
  { email: "safari@test.com", number: "+11234567004" },
  { email: "chatgptatlas@test.com", number: "+11234567005" },
  { email: "edge@test.com", number: "+11234567006" },
  { email: "firefox@test.com", number: "+11234567007" },
  { email: "arc@test.com", number: "+11234567008" },
  { email: "whale@test.com", number: "+11234567009" },
  { email: "genspark@test.com", number: "+11234567010" },
  { email: "dia@test.com", number: "+11234567011" },
  { email: "vivaldi@test.com", number: "+11234567012" },
  { email: "min@test.com", number: "+11234567013" },
  { email: "comet@test.com", number: "+11234567014" },
  { email: "zen@test.com", number: "+11234567015" },
];

async function runCode() {
  for (const u of users) {
    try {
      const userRecord = await getAuth().getUserByEmail(u.email);
      await getAuth().deleteUser(userRecord.uid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        console.log("Error deleting user:", error);
      }
    }
    // Create a new user with the same email and phone number

    getAuth()
      .createUser({
        uid: u.email.split("@")[0],
        email: u.email,
        emailVerified: false,
        phoneNumber: u.number,
        password: "12345a,*",
        displayName:
          u.email.split("@")[0].charAt(0).toUpperCase() +
          u.email.split("@")[0].slice(1),
        photoURL: "https://picsum.photos/200/300",
        disabled: false,
      })
      .then((userRecord) => {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully created new user:", userRecord.uid);
      })
      .catch((error) => {
        console.log("Error creating new user:", error);
      });
  }
}

runCode();
