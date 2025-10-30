// 개발일지 페이지
// 프로젝트의 스터디 로그와 진행 상황을 기록합니다.

export default function DevHistoryPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-4xl font-bold text-[#050505]">📝 스터디 로그</h1>
          <p className="mt-2 text-sm text-[#65676b]">
            한바보 프로젝트의 개발 진행 현황을 기록합니다.
          </p>
        </div>

        {/* 2025-10-27 세미나 */}
        <div className="space-y-4">
          {/* 날짜 및 제목 */}
          <div className="border-l-4 border-[#1877f2] bg-white/70 pl-4">
            <h2 className="text-2xl font-semibold text-[#050505]">
              2025-10-27 (첫 번째 세미나)
            </h2>
          </div>

          {/* 구현 완료 섹션 */}
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#050505]">
              ✅ 구현 완료
            </h3>
            <ul className="space-y-2 text-sm text-[#65676b]">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>기본 프로젝트 셋업 (Next.js 16, React 19, TypeScript)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>Firebase 설정 및 인증 구현</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>이메일/비밀번호 회원가입 &amp; 로그인</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>회원 정보 수정 (프로필 업데이트)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>1:1 채팅 기능 (실시간 메시지 동기화)</span>
              </li>
            </ul>
          </div>

          {/* 배운 것들 섹션 */}
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#050505]">
              💡 배운 것들
            </h3>
            <ul className="space-y-2 text-sm text-[#65676b]">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>Next.js App Router 구조 이해</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>Firebase Authentication 사용법</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>Firebase Realtime Database 실시간 동기화</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#1877f2]">•</span>
                <span>Git PR을 통한 협업 방식</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-[#dfe1e6]" />

        {/* 향후 추가될 로그를 위한 공간 */}
        <div className="rounded-2xl border border-[#e4e6eb] bg-white p-8 text-center text-sm text-[#65676b] shadow-sm">
          더 많은 스터디 로그가 추가될 예정입니다...
        </div>
      </div>
    </div>
  );
}
