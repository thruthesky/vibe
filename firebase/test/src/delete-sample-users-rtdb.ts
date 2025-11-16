/**
 * Realtime Database의 `/users/{uid}` 경로에서 `test: true`로 표시된 사용자 노드를 삭제합니다.
 * `tsx delete-sample-users-rtdb.ts` 명령으로 실행하며, 동일 디렉터리의 `admin.key` 파일을 사용합니다.
 */

import admin from 'firebase-admin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_PATH = 'users';

/**
 * Firebase Admin 초기화
 */
async function initializeFirebase(): Promise<void> {
	if (admin.apps.length > 0) {
		return;
	}

	// GOOGLE_APPLICATION_CREDENTIALS 환경변수 설정
	const serviceAccountPath = path.resolve(__dirname, '../admin-service-account-key.json');
	process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;

	// Application Default Credentials 사용
	admin.initializeApp({
		credential: admin.credential.applicationDefault(),
		databaseURL: 'https://sonub-firebase-default-rtdb.firebaseio.com'
	});

	console.info(`Firebase Admin 초기화 완료`);
	console.info(`Service Account: ${serviceAccountPath}`);
	console.info(`Realtime Database URL: https://sonub-firebase-default-rtdb.firebaseio.com`);
}

/**
 * `test: true` 플래그가 설정된 사용자 노드를 삭제합니다.
 */
async function deleteTestUsers(): Promise<void> {
	const database = admin.database();
	const usersRef = database.ref(USERS_PATH);

	console.info('테스트 사용자를 조회하는 중...\n');

	// /users 경로의 모든 데이터를 읽어옵니다
	const snapshot = await usersRef.once('value');

	if (!snapshot.exists()) {
		console.info('❌ /users 경로에 데이터가 없습니다.');
		return;
	}

	// test: true인 사용자만 필터링합니다
	const testUserIds: string[] = [];
	snapshot.forEach((childSnapshot) => {
		const userData = childSnapshot.val();
		if (userData && userData.test === true) {
			testUserIds.push(childSnapshot.key!);
		}
	});

	if (testUserIds.length === 0) {
		console.info('✅ 삭제할 테스트 사용자가 없습니다.');
		return;
	}

	const total = testUserIds.length;
	console.info(`총 ${total}명의 테스트 사용자를 삭제합니다...\n`);

	// 각 테스트 사용자 노드를 삭제합니다
	for (let index = 0; index < total; index++) {
		const uid = testUserIds[index];
		await database.ref(`${USERS_PATH}/${uid}`).remove();

		const progress = Math.round(((index + 1) / total) * 100);
		console.info(`(${index + 1}/${total}) ${uid} 삭제 완료 - ${progress}%`);
	}

	console.info(`\n✅ test 플래그가 설정된 사용자 ${total}명을 삭제했습니다.`);
}

async function main() {
	try {
		await initializeFirebase();
		await deleteTestUsers();
		process.exit(0);
	} catch (error) {
		console.error('❌ 테스트 사용자 삭제 중 오류가 발생했습니다:', error);
		process.exit(1);
	}
}

void main();
