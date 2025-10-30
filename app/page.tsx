// 홈페이지 컴포넌트
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* 바이브 코딩 배너 */}
        <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-800 text-center">
          <p className="text-sm font-medium">
            🤖 현재 보시고 계시는 이 사이트는 100% 바이브 코딩으로만
            만들어졌습니다.
          </p>
        </div>

        {/* AI 명언 */}
        <div className="bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            💡 AI 시대의 진실
          </h2>
          <div className="space-y-4">
            {/* 명언 1 */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <p className="text-foreground leading-relaxed pt-1">
                  AI 시대에 변하지 않는 것은 당신입니다.
                </p>
              </div>
            </div>

            {/* 명언 2 */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <p className="text-foreground leading-relaxed pt-1">
                  AI 만으로 할 수 있는 것은 아무 것도 없습니다. 프롬프트
                  엔지니어링, 컨텍스트 드리븐, 스펙킷 등으로 만들 수 있는 것은
                  아무것도 없습니다.
                </p>
              </div>
            </div>

            {/* 명언 3 */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="text-foreground leading-relaxed pt-1 space-y-2">
                  <p>
                    AI 만은 웹/앱에는 저작권이 없습니다. AI 로 음악을 생성하는
                    것과 다르게, 웹/앱을 개발하기 위해서는 무수한 작안 라이브러리
                    모듈들이 모여서 만들어지며, 각 모듈은 다른 저작원을 가지고
                    있습니다.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    웹/앱이 사용하는 수백, 수천개의 저작권을 모두 알고 있나요?
                    GPL 라이센스를 가지는 라이브러리 모듈이 흔하죠? 그러한
                    것들을 여러분들이 만든 소프트웨어는 오픈 소스로 공개를 해야
                    합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 페이지 제목 및 소개 */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            바이브 코딩 스터디 프로젝트
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            누구든지 참여를 할 수 있습니다. PR 하시거나,{" "}
            <a
              href="https://open.kakao.com/o/gn2qMetf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              한바보
            </a>{" "}
            단톡방에 참여해주세요.
          </p>
        </div>

        {/* TODO 목록 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            📋 해야할 일 (TODO)
          </h2>
          <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
            <li>
              <strong>디자인:</strong> 탑바에 로그인 사용자 업로드.
            </li>
            <li>
              <strong>대화방 참여 목록:</strong> vibe/chat/joins 에 저장해서,
              채팅방 목록을 표시하고, 클릭하여 입장.
              <ol className="mt-2 space-y-1 list-decimal ml-8">
                <li>그룹 채팅: 생성, 수정, 삭제, 초대</li>
                <li>
                  오픈 채팅: 로그인 없이 채팅방 입장 가능, 단 메시지 전송은
                  로그인 필요
                </li>
              </ol>
            </li>
            <li>
              <strong>모든 함수를 API 화 시키기</strong>
            </li>
            <li>
              <strong>게시판</strong>
              <ol className="mt-2 space-y-1 list-decimal ml-8">
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
              <strong>푸시 알림</strong>
              <ol className="mt-2 space-y-1 list-decimal ml-8">
                <li>채팅방에 알림 구독(선택)</li>
                <li>댓글이 달린 경우, 푸시 알림</li>
              </ol>
            </li>
            <li>
              <strong>Flutter iOS/Android 앱 개발</strong>
              <ol className="mt-2 space-y-1 list-decimal ml-8">
                <li>웹의 모든 기능을 구현</li>
              </ol>
            </li>
          </ol>
        </div>

        {/* 프로젝트 개요 */}
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            AI와 함께하는 협업 개발 경험
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">한바보</strong>(한국 바이버
            보스)는 AI 기반 바이브 코딩으로 실전 소셜 웹 애플리케이션을 만드는
            오픈소스 스터디 커뮤니티입니다. 코드는 AI에게 맡기고, 설계와 기획에
            집중하며, Git을 통한 협업과 실제 배포까지 경험합니다. 인증, 게시판,
            채팅, 알림 등 실용적인 기능을 구현하며, 지속 가능한 개발 능력과 AI
            컨트롤 역량을 기릅니다.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-full text-sm text-muted-foreground">
              💬 소스 코딩 금지
            </span>
            <span className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-full text-sm text-muted-foreground">
              🤝 실전 협업
            </span>
            <span className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-full text-sm text-muted-foreground">
              🎯 실용적 기능
            </span>
            <span className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-full text-sm text-muted-foreground">
              📚 함께 성장
            </span>
          </div>
        </div>

        {/* AI 시대의 변화와 성장 */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            🚀 AI 시대, 변하지 않는 것은 바로 당신입니다
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            인공지능은 계속해서 발전하고 있고, 각종 툴도 계속해서 업그레이드되고
            있으며, 에이전트나 인공지능 관련 프로세스들도 계속해서 빠르게
            업데이트 중입니다.
          </p>
          <p className="text-foreground font-medium leading-relaxed">
            다만 한 가지 변하지 않는 것은 바로{" "}
            <strong className="text-blue-600">여러분 자신</strong>입니다.
            인공지능 시대에 맞게 여러분 자신도 업그레이드해야 할 것입니다.
          </p>
          <div className="bg-white/60 rounded-md p-4 border border-blue-100">
            <p className="text-sm text-muted-foreground italic">
              💡 AI는 도구일 뿐, 진정한 가치를 만드는 것은 당신의 생각과
              실행력입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
