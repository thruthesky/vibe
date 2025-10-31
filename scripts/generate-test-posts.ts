// 테스트용 게시글 생성 스크립트
// news 카테고리에 100개의 랜덤 뉴스 글을 생성합니다.

import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set } from "firebase/database";

// Firebase 설정 (환경 변수에서 가져오기)
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

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

const ROOT_FOLDER = "vibe";

// 뉴스 제목 샘플
const newsTitles = [
  "AI 기술의 최신 동향과 미래 전망",
  "글로벌 경제 회복세, 전문가 분석",
  "친환경 에너지 정책 주요 변화 발표",
  "메타버스 산업 급성장, 투자 열기 고조",
  "5G 네트워크 확대로 스마트시티 가속화",
  "전기차 시장 점유율 30% 돌파",
  "반도체 공급난 해소 조짐 보여",
  "원격근무 시대, 기업 문화 변화 주목",
  "디지털 화폐 도입 논의 본격화",
  "우주 개발 경쟁 심화, 민간 기업 약진",
  "기후변화 대응 국제 협력 강화",
  "헬스케어 혁신, 원격 의료 서비스 확대",
  "사이버 보안 위협 증가, 대응 방안 마련",
  "교육 플랫폼 디지털 전환 가속",
  "로봇 산업 성장세, 일자리 영향 분석",
];

// 뉴스 내용 샘플
const newsContents = [
  "최근 발표된 연구 결과에 따르면, 해당 분야의 성장세가 지속되고 있으며 전문가들은 긍정적인 전망을 내놓고 있습니다. 관련 업계에서는 이번 변화가 큰 영향을 미칠 것으로 예상하고 있습니다.",
  "업계 관계자들은 이번 발표가 시장에 중요한 전환점이 될 것이라고 평가했습니다. 특히 소비자들의 관심이 높아지면서 관련 기업들의 투자도 증가하고 있는 추세입니다.",
  "전문가들은 향후 몇 년간 이러한 추세가 계속될 것으로 전망하고 있습니다. 정부 당국도 관련 정책 수립에 적극 나서고 있어 업계의 기대감이 높아지고 있습니다.",
  "이번 변화는 글로벌 시장에도 큰 영향을 미칠 것으로 보입니다. 국내외 전문가들은 다양한 분석과 의견을 제시하며 향후 전망에 대해 활발한 논의를 이어가고 있습니다.",
  "관련 분야 종사자들은 새로운 기회를 모색하고 있으며, 정부와 기업들도 적극적인 지원 방안을 마련하고 있습니다. 앞으로의 변화가 주목됩니다.",
];

// 작성자 샘플
const authors = [
  "뉴스 편집국",
  "경제부 기자",
  "IT 전문 기자",
  "정책 분석팀",
  "글로벌 뉴스팀",
  "산업부 기자",
  "기술 리포터",
  "시장 분석가",
];

// 랜덤 요소 선택 함수
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 랜덤 시간 생성 (최근 30일 이내)
function getRandomTimestamp(): number {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return Math.floor(Math.random() * (now - thirtyDaysAgo)) + thirtyDaysAgo;
}

// 게시글 생성 함수
async function createTestPost(index: number) {
  const category = "news";
  const postsRef = ref(rtdb, `${ROOT_FOLDER}/forums/${category}/posts`);
  const newPostRef = push(postsRef);

  const timestamp = getRandomTimestamp();
  const title = `${getRandomItem(newsTitles)} ${index + 1}`;
  const content = `${getRandomItem(newsContents)}\n\n${getRandomItem(newsContents)}`;
  const author = getRandomItem(authors);

  const postData = {
    uid: "test-user-id",
    title,
    content,
    author,
    category,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await set(newPostRef, postData);
  console.log(`게시글 ${index + 1}/100 생성 완료: ${title}`);
}

// 메인 실행 함수
async function generateTestPosts() {
  console.log("뉴스 카테고리에 테스트 게시글 100개 생성을 시작합니다...");

  try {
    for (let i = 0; i < 100; i++) {
      await createTestPost(i);
      // API 호출 제한을 피하기 위해 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("✅ 100개의 테스트 게시글 생성 완료!");
  } catch (error) {
    console.error("❌ 게시글 생성 중 오류 발생:", error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
generateTestPosts();
