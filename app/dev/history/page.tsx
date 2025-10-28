// 개발일지 페이지
// 프로젝트의 스터디 로그와 진행 상황을 기록합니다.

export default function DevHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">📝 스터디 로그</h1>

      {/* 2025-10-27 세미나 */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            2025-10-27 (첫 번째 세미나)
          </h2>
        </div>

        {/* 구현 완료 섹션 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-green-600">
            구현 완료
          </h3>
          <ul className="space-y-2 ml-6">
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>기본 프로젝트 셋업 (Next.js 16, React 19, TypeScript)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Firebase 설정 및 인증 구현</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>이메일/비밀번호 회원가입 & 로그인</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>회원 정보 수정 (프로필 업데이트)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>1:1 채팅 기능 (실시간 메시지 동기화)</span>
            </li>
          </ul>
        </div>

        {/* 배운 것들 섹션 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-blue-600">
            배운 것들
          </h3>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Next.js App Router 구조 이해</li>
            <li>Firebase Authentication 사용법</li>
            <li>Firebase Realtime Database 실시간 동기화</li>
            <li>Git PR을 통한 협업 방식</li>
          </ul>
        </div>
      </div>

      <hr className="my-8 border-t-2" />

      {/* 향후 추가될 로그를 위한 공간 */}
      <div className="text-center text-muted-foreground py-8">
        <p>더 많은 스터디 로그가 추가될 예정입니다...</p>
      </div>
    </div>
  );
}
