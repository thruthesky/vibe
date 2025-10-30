// 홈페이지 컴포넌트
// shadcn/ui Accordion 컴포넌트 임포트
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f0f2f5]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-[-10%] h-64 w-64 rounded-full bg-[#d9e7ff] opacity-70 blur-3xl" />
        <div className="absolute top-1/2 right-[-15%] h-72 w-72 rounded-full bg-[#e6f4ea] opacity-60 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[25%] h-80 w-80 rounded-full bg-[#efe6ff] opacity-60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-12 space-y-12">
        {/* 바이브 코딩 배너 */}
        <div className="rounded-3xl border border-white/40 bg-white/95 px-6 py-5 text-center shadow-lg shadow-[#d2dbe6]/50 backdrop-blur">
          <p className="text-sm font-semibold text-[#1877f2]">
            🤖 현재 보시고 계시는 이 사이트는 100% 바이브 코딩으로만 만들어졌습니다.
          </p>
        </div>

        {/* AI 시대의 진실 - 아코디언 형식 */}
        <div className="rounded-3xl border border-white/60 bg-white/95 p-8 shadow-xl shadow-[#cfdaf2]/45 backdrop-blur space-y-5">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#050505]">
            💡 AI 시대의 진실
          </h2>

          {/* 아코디언 컴포넌트 */}
          <Accordion type="single" collapsible className="space-y-3">
            {/* 아코디언 항목 1 - AI 시대에 변하지 않는 것은 당신 */}
            <AccordionItem
              value="item-1"
              className="overflow-hidden rounded-2xl border border-transparent bg-[#f5f6f7] shadow-inner transition-transform duration-200 data-[state=open]:scale-[1.01]"
            >
              <AccordionTrigger className="px-4 py-3 text-left transition-colors hover:bg-[#ebedf0] data-[state=open]:bg-white data-[state=open]:shadow-lg data-[state=open]:shadow-[#dce3f3]/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ff] text-sm font-bold text-[#1877f2] shadow-inner shadow-[#bdd4fd]/70">
                    1
                  </div>
                  <span className="text-sm font-semibold text-[#050505] sm:text-base">
                    AI 시대에 변하지 않는 것은 당신입니다.
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white/95 px-4 pb-4 text-sm leading-relaxed text-[#5d6472]">
                매일 더욱 더 강력한 인공지능, 툴, 에이전트가 쏟아지고 있습니다. 여러분들은 매일 어떻게 변하고 있나요?
              </AccordionContent>
            </AccordionItem>

            {/* 아코디언 항목 2 - AI 만으로 할 수 있는 것은 없다 */}
            <AccordionItem
              value="item-2"
              className="overflow-hidden rounded-2xl border border-transparent bg-[#f5f6f7] shadow-inner transition-transform duration-200 data-[state=open]:scale-[1.01]"
            >
              <AccordionTrigger className="px-4 py-3 text-left transition-colors hover:bg-[#ebedf0] data-[state=open]:bg-white data-[state=open]:shadow-lg data-[state=open]:shadow-[#dce3f3]/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f4ea] text-sm font-bold text-[#1b5e20] shadow-inner shadow-[#b2deb9]/70">
                    2
                  </div>
                  <span className="text-sm font-semibold text-[#050505] sm:text-base">
                    AI 만으로 할 수 있는 것은 아무 것도 없습니다.
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 bg-white/95 px-4 pb-4 text-sm leading-relaxed text-[#5d6472]">
                <p>
                  실용적인 웹/앱을 만들기 위해서는 인간의 수 많은 개입이 필요합니다. AI 는 결국 생각없이 입력이 주어지면 그에 따른 출력을 할 뿐입니다.
                </p>
                <p className="text-xs text-[#8d949e]">
                  AI 는 도구일 뿐, 원하는 결과물이 만들어지도록 방향을 제시하고 통제해야 합니다.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 아코디언 항목 3 - 저작권 문제 */}
            <AccordionItem
              value="item-3"
              className="overflow-hidden rounded-2xl border border-transparent bg-[#f5f6f7] shadow-inner transition-transform duration-200 data-[state=open]:scale-[1.01]"
            >
              <AccordionTrigger className="px-4 py-3 text-left transition-colors hover:bg-[#ebedf0] data-[state=open]:bg-white data-[state=open]:shadow-lg data-[state=open]:shadow-[#e3d5fb]/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4e8ff] text-sm font-bold text-[#7f35c9] shadow-inner shadow-[#d3b6ff]/70">
                    3
                  </div>
                  <span className="text-sm font-semibold text-[#050505] sm:text-base">
                    AI 로 만든 웹/앱에는 저작권이 없습니다.
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 bg-white/95 px-4 pb-4 text-sm leading-relaxed text-[#5d6472]">
                <p>
                  음악을 인공지능(AI)으로 만드는 것 보다 훨씬 저작권 제약이 큽니다. 간단한 소프트웨어를 개발하기 위해서는 수백/수천 개의 오픈소스 라이브러리 모듈이 사용됩니다.
                </p>
                <p className="font-medium text-[#b43a3a]">
                  GPL 라이센스를 쓰는 모든 소프트웨어는 오픈소스로 공개되어야 합니다.
                </p>
                <p className="italic">
                  여러분들이 만드는 소프트웨어가 쓰는 모든 라이브러리의 저작권을 확인하셨나요? 그렇지 않으면 여러분은 자신도 모르게 저작권 위반을 하고 계신 것입니다.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* 페이지 제목 및 소개 */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-[#050505] sm:text-[2.75rem]">
            바이브 코딩 스터디 프로젝트
          </h1>
          <p className="text-lg leading-relaxed text-[#5d6472]">
            누구든지 참여를 할 수 있습니다. PR 하시거나,{" "}
            <a
              href="https://open.kakao.com/o/gn2qMetf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1877f2] hover:underline"
            >
              한바보
            </a>{" "}
            단톡방에 참여해주세요.
          </p>
        </div>

        {/* TODO 목록 */}
        <div className="rounded-3xl border border-white/55 bg-white/95 p-8 shadow-lg shadow-[#c9d7f0]/45 backdrop-blur space-y-5">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#050505]">
            📋 해야할 일 (TODO)
          </h2>
          <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-[#505766] marker:text-[#1877f2]">
            <li>
              <strong className="text-[#050505]">디자인:</strong> 탑바에 로그인 사용자 정보 표시.
            </li>
            <li>
              <strong className="text-[#050505]">회원 정보 수정:</strong> 회원 사진 등록. 회원 정보 실시간 업데이트
            </li>
            <li>
              <strong className="text-[#050505]">대화방 참여 목록:</strong> vibe/chat/joins 에 저장해서,
              채팅방 목록을 표시하고, 클릭하여 입장.
              <ol className="ml-8 mt-2 list-decimal space-y-1">
                <li>그룹 채팅: 생성, 수정, 삭제, 초대</li>
                <li>
                  오픈 채팅: 로그인 없이 채팅방 입장 가능, 단 메시지 전송은
                  로그인 필요
                </li>
              </ol>
            </li>
            <li>
              <strong className="text-[#050505]">모든 함수를 API 화 시키기</strong>
            </li>
            <li>
              <strong className="text-[#050505]">게시판</strong>
              <ol className="ml-8 mt-2 list-decimal space-y-1">
                <li>게시판 글/코멘트을 RTDB 에 저장(sync)</li>
                <li>게시를 SEO 를 위해서, RTDB 글을 Supabase 로 캐시.</li>
                <li>
                  서버에서 렌더링하는 경우는 무조건 Supabase 에서 데이터
                  가져오기.
                </li>
                <li>
                  클라이언트에서 Hydration 후, RTDB 에서 글 가져와 Reboot
                  (렌더링)
                </li>
              </ol>
            </li>
            <li>
              <strong className="text-[#050505]">푸시 알림</strong>
              <ol className="ml-8 mt-2 list-decimal space-y-1">
                <li>채팅방에 알림 구독(선택)</li>
                <li>댓글이 달린 경우, 푸시 알림</li>
              </ol>
            </li>
            <li>
              <strong className="text-[#050505]">Flutter iOS/Android 앱 개발</strong>
              <ol className="ml-8 mt-2 list-decimal space-y-1">
                <li>웹의 모든 기능을 구현</li>
              </ol>
            </li>
          </ol>
        </div>

        {/* 프로젝트 개요 */}
        <div className="rounded-3xl border border-white/65 bg-white/90 p-6 shadow-xl shadow-[#cad6ea]/45 backdrop-blur space-y-4">
          <h2 className="text-2xl font-semibold text-[#050505]">
            AI와 함께하는 협업 개발 경험
          </h2>
          <p className="leading-relaxed text-[#5d6472]">
            <strong className="text-[#050505]">한바보</strong>(한국 바이버
            보스)는 AI 기반 바이브 코딩으로 실전 소셜 웹 애플리케이션을 만드는
            오픈소스 스터디 커뮤니티입니다. 코드는 AI에게 맡기고, 설계와 기획에
            집중하며, Git을 통한 협업과 실제 배포까지 경험합니다. 인증, 게시판,
            채팅, 알림 등 실용적인 기능을 구현하며, 지속 가능한 개발 능력과 AI
            컨트롤 역량을 기릅니다.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center rounded-full border border-[#dfe1e6] bg-[#f5f7fb] px-3 py-1 text-sm text-[#5a6270] shadow-inner shadow-white/60">
              💬 소스 코딩 금지
            </span>
            <span className="inline-flex items-center rounded-full border border-[#dfe1e6] bg-[#f5f7fb] px-3 py-1 text-sm text-[#5a6270] shadow-inner shadow-white/60">
              🤝 실전 협업
            </span>
            <span className="inline-flex items-center rounded-full border border-[#dfe1e6] bg-[#f5f7fb] px-3 py-1 text-sm text-[#5a6270] shadow-inner shadow-white/60">
              🎯 실용적 기능
            </span>
            <span className="inline-flex items-center rounded-full border border-[#dfe1e6] bg-[#f5f7fb] px-3 py-1 text-sm text-[#5a6270] shadow-inner shadow-white/60">
              📚 함께 성장
            </span>
          </div>
        </div>

        {/* AI 시대의 변화와 성장 */}
        <div className="rounded-3xl border border-[#ccd9f6]/80 bg-gradient-to-r from-[#e6f0ff] via-[#f3f4ff] to-[#f6f7fb] p-8 shadow-xl shadow-[#c3d2f1]/40 space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#050505]">
            🚀 AI 시대, 변하지 않는 것은 바로 당신입니다
          </h2>
          <p className="leading-relaxed text-[#5d6472]">
            인공지능은 계속해서 발전하고 있고, 각종 툴도 계속해서 업그레이드되고
            있으며, 에이전트나 인공지능 관련 프로세스들도 계속해서 빠르게
            업데이트 중입니다.
          </p>
          <p className="font-medium leading-relaxed text-[#050505]">
            다만 한 가지 변하지 않는 것은 바로{" "}
            <strong className="text-[#1877f2]">여러분 자신</strong>입니다.
            인공지능 시대에 맞게 여러분 자신도 업그레이드해야 할 것입니다.
          </p>
          <div className="rounded-2xl border border-[#d8e8ff] bg-white/80 p-5 shadow-inner shadow-white/70">
            <p className="text-sm italic text-[#5d6472]">
              💡 AI는 도구일 뿐, 진정한 가치를 만드는 것은 당신의 생각과
              실행력입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
