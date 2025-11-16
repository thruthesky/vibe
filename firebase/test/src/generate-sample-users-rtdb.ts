/**
 * Firebase Admin SDK를 사용하여 Realtime Database의 /users/{uid}에
 * 테스트 사용자 100명을 생성하는 스크립트입니다.
 * `tsx generate-sample-users-rtdb.ts`로 실행할 수 있으며, service account 키는
 * 현재 디렉터리의 `admin.key` 파일을 사용합니다.
 */

import admin, { ServiceAccount } from 'firebase-admin';
import { generateTestUsers, testUserToFirebaseData } from './test-user-generator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_PATH = 'users';
const MIN_BIRTH_YEAR = 1950;
const MAX_BIRTH_YEAR = 2010;
const MIN_BIRTH_MONTH = 1;
const MAX_BIRTH_MONTH = 12;
const MIN_BIRTH_DAY = 1;
const MAX_BIRTH_DAY = 28;

/**
 * service account JSON 을 로드합니다.
 */
async function loadServiceAccount(): Promise<ServiceAccount> {
	const serviceAccountPath = path.resolve(__dirname, '../admin-service-account-key.json');
	console.info(`Service Account: ${serviceAccountPath}`);
	const json = await readFile(serviceAccountPath, 'utf-8');
	return JSON.parse(json) as ServiceAccount;
}


/**
 * Firebase Admin 인스턴스를 초기화합니다.
 */
async function initializeFirebase(): Promise<void> {
	if (admin.apps.length > 0) {
		return;
	}
		const serviceAccount = await loadServiceAccount();
	  admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: 'https://sonub-firebase-default-rtdb.asia-southeast1.firebasedatabase.app'
	});

	
	console.info(`Firebase Admin 초기화 완료`);
	console.info(`Realtime Database URL: https://sonub-firebase-default-rtdb.asia-southeast1.firebasedatabase.app`);
}

/**
 * Realtime Database의 /users/<uid>에 테스트 사용자를 저장합니다.
 */
async function createSampleUsers(): Promise<void> {
	const database = admin.database();
	const testUsers = generateTestUsers();
	const total = testUsers.length;

	console.info(`\n총 ${total}명의 테스트 사용자를 생성합니다...\n`);

	for (let index = 0; index < total; index++) {
		const user = testUsers[index];
		const gender = Math.random() < 0.5 ? 'M' : 'F';
		const birthYear = getRandomInt(MIN_BIRTH_YEAR, MAX_BIRTH_YEAR);
		const birthMonth = getRandomInt(MIN_BIRTH_MONTH, MAX_BIRTH_MONTH);
		const birthDay = getRandomInt(MIN_BIRTH_DAY, MAX_BIRTH_DAY);
		const birthYearMonthDay = buildBirthDateString(birthYear, birthMonth, birthDay);
		const birthMonthDay = buildBirthMonthDayString(birthMonth, birthDay);
		const photoUrl = buildRandomPhotoUrl(user.uid);

		// 최근 1년 내 랜덤 생성 시간
		const createdAt = Date.now() - getRandomInt(0, 365 * 24 * 60 * 60 * 1000);
		// 생성 후 최대 30일 내 업데이트 시간
		const updatedAt = createdAt + getRandomInt(0, 30 * 24 * 60 * 60 * 1000);

		const data = {
			...testUserToFirebaseData(user),
			gender,
			birthYear,
			birthMonth,
			birthDay,
			birthYearMonthDay,
			birthMonthDay,
			photoUrl,
			bio: `안녕하세요! ${user.displayName}입니다. 테스트 계정입니다.`,
			createdAt,
			updatedAt,
			displayNameLowerCase: user.displayName.toLowerCase(),
			test: true
		};

		const userRef = database.ref(`${USERS_PATH}/${user.uid}`);
		await userRef.set(data);

		const progress = Math.round(((index + 1) / total) * 100);
		console.info(`(${index + 1}/${total}) ${user.displayName} (${gender}, ${birthYear}년생) 저장 완료 - ${progress}%`);
	}

	console.info(`\n✅ 테스트 사용자 ${total}명 생성이 완료되었습니다.`);
}

async function main() {
	try {
		await initializeFirebase();
		await createSampleUsers();
		process.exit(0);
	} catch (error) {
		console.error('❌ 테스트 사용자 생성 중 오류가 발생했습니다:', error);
		process.exit(1);
	}
}

void main();

/**
 * 최소/최대 범위에서 랜덤 정수를 반환합니다.
 */
function getRandomInt(min: number, max: number): number {
	const floorMin = Math.ceil(min);
	const floorMax = Math.floor(max);
	return Math.floor(Math.random() * (floorMax - floorMin + 1)) + floorMin;
}

/**
 * picsum.photos 이미지 URL을 반환합니다.
 */
function buildRandomPhotoUrl(seed: string): string {
	return `https://picsum.photos/seed/${seed}/400/400`;
}

/**
 * YYYY-MM-DD 형태의 문자열을 반환합니다.
 */
function buildBirthDateString(year: number, month: number, day: number): string {
	const paddedMonth = String(month).padStart(2, '0');
	const paddedDay = String(day).padStart(2, '0');
	return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * MM-DD 형태의 문자열을 반환합니다.
 */
function buildBirthMonthDayString(month: number, day: number): string {
	const paddedMonth = String(month).padStart(2, '0');
	const paddedDay = String(day).padStart(2, '0');
	return `${paddedMonth}-${paddedDay}`;
}
