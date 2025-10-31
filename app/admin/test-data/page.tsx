"use client";

// 관리자 페이지 - 테스트 데이터 생성
// news 카테고리에 100개의 랜덤 뉴스 글을 생성합니다.

import { useState } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";
import { Button } from "@/components/ui/button";

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
  "스마트팜 기술 발전, 농업 혁신 주도",
  "양자 컴퓨팅 상용화 앞당겨질 전망",
  "바이오 헬스케어 시장 급성장 예상",
  "드론 택배 서비스 본격 시작",
  "인공지능 윤리 가이드라인 제정",
];

// 뉴스 내용 샘플
const newsContents = [
  "최근 발표된 연구 결과에 따르면, 해당 분야의 성장세가 지속되고 있으며 전문가들은 긍정적인 전망을 내놓고 있습니다. 관련 업계에서는 이번 변화가 큰 영향을 미칠 것으로 예상하고 있습니다.",
  "업계 관계자들은 이번 발표가 시장에 중요한 전환점이 될 것이라고 평가했습니다. 특히 소비자들의 관심이 높아지면서 관련 기업들의 투자도 증가하고 있는 추세입니다.",
  "전문가들은 향후 몇 년간 이러한 추세가 계속될 것으로 전망하고 있습니다. 정부 당국도 관련 정책 수립에 적극 나서고 있어 업계의 기대감이 높아지고 있습니다.",
  "이번 변화는 글로벌 시장에도 큰 영향을 미칠 것으로 보입니다. 국내외 전문가들은 다양한 분석과 의견을 제시하며 향후 전망에 대해 활발한 논의를 이어가고 있습니다.",
  "관련 분야 종사자들은 새로운 기회를 모색하고 있으며, 정부와 기업들도 적극적인 지원 방안을 마련하고 있습니다. 앞으로의 변화가 주목됩니다.",
  "시장 분석가들은 이번 발표를 긍정적으로 평가하고 있으며, 향후 성장 가능성에 대해 낙관적인 전망을 제시했습니다.",
  "산업계 리더들은 이러한 변화에 발맞춰 새로운 전략을 수립하고 있으며, 글로벌 경쟁력 강화에 힘쓰고 있습니다.",
  "연구진은 지속적인 혁신과 투자가 필요하다고 강조하며, 장기적인 관점에서의 접근이 중요하다고 덧붙였습니다.",
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

export default function AdminTestDataPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);

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
    const title = `${getRandomItem(newsTitles)} #${index + 1}`;
    const content = `${getRandomItem(newsContents)}\n\n${getRandomItem(newsContents)}`;
    const author = getRandomItem(authors);

    const postData = {
      uid: "test-admin",
      title,
      content,
      author,
      category,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await set(newPostRef, postData);
    return title;
  }

  // 100개 게시글 생성 핸들러
  async function handleGeneratePosts() {
    setIsGenerating(true);
    setProgress(0);
    setLog([]);

    try {
      addLog("뉴스 카테고리에 테스트 게시글 100개 생성을 시작합니다...");

      for (let i = 0; i < 100; i++) {
        const title = await createTestPost(i);
        setProgress(i + 1);
        addLog(`[${i + 1}/100] 생성 완료: ${title}`);

        // API 호출 제한을 피하기 위해 약간의 지연
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      addLog("✅ 100개의 테스트 게시글 생성 완료!");
      alert("테스트 게시글 100개 생성이 완료되었습니다!");
    } catch (error) {
      console.error("게시글 생성 오류:", error);
      addLog(`❌ 오류 발생: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
      alert("게시글 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  // 로그 추가 함수
  function addLog(message: string) {
    setLog((prev) => [...prev, message]);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          관리자 페이지 - 테스트 데이터 생성
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          news 카테고리에 100개의 랜덤 뉴스 글을 생성합니다.
        </p>

        {/* 생성 버튼 */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <Button
            onClick={handleGeneratePosts}
            disabled={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating
              ? `생성 중... (${progress}/100)`
              : "뉴스 게시글 100개 생성하기"}
          </Button>

          {isGenerating && (
            <div className="mt-4">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-slate-600 mt-2">
                {progress}% 완료
              </p>
            </div>
          )}
        </div>

        {/* 로그 영역 */}
        {log.length > 0 && (
          <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-96">
            {log.map((message, index) => (
              <div key={index} className="mb-1">
                {message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
