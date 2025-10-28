// 개발일지 페이지
// 프로젝트의 스터디 로그와 진행 상황을 기록합니다.

export default function DevHistoryPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">📝 스터디 로그</h1>
          <p className="text-muted-foreground mt-2">한바보 프로젝트의 개발 진행 현황을 기록합니다</p>
        </div>

        {/* 2025-10-27 세미나 */}
        <div className="space-y-4">
          {/* 날짜 및 제목 */}
          <div className="border-l-4 border-slate-400 pl-4">
            <h2 className="text-2xl font-semibold text-foreground">
              2025-10-27 (첫 번째 세미나)
            </h2>
          </div>

          {/* 구현 완료 섹션 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              ✅ 구현 완료
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>기본 프로젝트 셋업 (Next.js 16, React 19, TypeScript)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>Firebase 설정 및 인증 구현</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>이메일/비밀번호 회원가입 & 로그인</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>회원 정보 수정 (프로필 업데이트)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>1:1 채팅 기능 (실시간 메시지 동기화)</span>
              </li>
            </ul>
          </div>

          {/* 배운 것들 섹션 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              💡 배운 것들
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>Next.js App Router 구조 이해</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>Firebase Authentication 사용법</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>Firebase Realtime Database 실시간 동기화</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foreground font-semibold mt-1">•</span>
                <span>Git PR을 통한 협업 방식</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-slate-200"></div>

        {/* 향후 추가될 로그를 위한 공간 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">더 많은 스터디 로그가 추가될 예정입니다...</p>
        </div>
      </div>
    </div>
  );
}
