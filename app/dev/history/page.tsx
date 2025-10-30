// 개발일지 페이지
// 프로젝트의 스터디 로그와 진행 상황을 기록합니다.

export default function DevHistoryPage() {
  return (
    <div className="relative min-h-screen bg-[#f0f2f5] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(198,219,255,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,233,218,0.3),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl space-y-8">
        {/* 페이지 제목 */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[#050505]">📝 스터디 로그</h1>
          <p className="text-sm text-[#5d6472]">
            한바보 프로젝트의 개발 진행 현황을 기록합니다.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-[#1877f2] shadow-sm shadow-[#cfdbf4]/50 backdrop-blur">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#44c46f] shadow-[0_0_6px_rgba(68,196,111,0.45)]" />
            최신 업데이트 자동 동기화
          </div>
        </div>

        {/* 2025-10-27 세미나 */}
        <div className="space-y-4">
          {/* 날짜 및 제목 */}
          <div className="border-l-4 border-[#1877f2] bg-white/80 pl-4 shadow-sm shadow-[#bed4ff]/40">
            <h2 className="text-2xl font-semibold text-[#050505]">
              2025-10-27 (첫 번째 세미나)
            </h2>
          </div>

          {/* 구현 완료 섹션 */}
          <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#ccd9f0]/45 backdrop-blur space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#050505]">
              ✅ 구현 완료
            </h3>
            <ul className="space-y-2 text-sm text-[#5d6472]">
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
          <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-[#ccd9f0]/45 backdrop-blur space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#050505]">
              💡 배운 것들
            </h3>
            <ul className="space-y-2 text-sm text-[#5d6472]">
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
        <div className="rounded-3xl border border-white/60 bg-white/95 p-8 text-center text-sm text-[#5d6472] shadow-xl shadow-[#ccd9f0]/45 backdrop-blur">
          더 많은 스터디 로그가 추가될 예정입니다...
        </div>
      </div>
    </div>
  );
}
