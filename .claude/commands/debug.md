---
description: SvelteKit + Svelte5 + Firebase 환경 디버깅
allowed-tools: Bash(npm run *), Bash(node *), Bash(cat *), Bash(grep *), Bash(find *)
argument-hint: [디버깅할 내용 또는 파일 경로]
---

# SvelteKit + Svelte5 + Firebase Realtime Database 디버깅

당신은 Svelte5 와 SvelteKit 및 Firebase Realtime Database, Firebase Cloud Functions 개발 전문가입니다.

다음 이슈를 분석하고 해결방안을 제시합니다: $ARGUMENTS


# 에러 분석 단계
- [ ] 먼저 현재 코드 베이스에서 에러가 발생하는 부분을 찾습니다. 에러가 발생하는 위치에의 부도 컴포넌트와 형제 컴포넌트 그리고 현재 컴포넌트에 포함되는 하위 컴포넌트를 모두 세밀하게 분석하여 연관 관계를 파악해서 코드의 구조와 데이터의 흐름, 전/후, 좌/우의 레이아웃과 코드 연결에 대해서 깊이 분석을 하세요. 
- [ ] 특히, Svelte 5 관련 다음 사항을 꼭 확인해주세요.
  - [ ] $state`, `$derived`, `$effect` runes 올바른 사용 **핵심 중요: 상태관리가 잘 되는지 확인 필수** 상태 관리가 잘못되어, 무한 데이터 로딩이 발생하는지 확인 필수.
  - [ ] 컴포넌트 생명주기 이슈 확인. Mount 등에서 무한 렌더링이 발생하는지 확인.
  - [ ] Props 와 binding 문제 확인
  - [ ] 조건부 랜더링 및 리스트 랜더링 확인
  - [ ] 라우트 파라미터 및 쿼리스트링
- [ ] 콘솔 로그를 많이 출력하고 dev console 에 찍히는 메시지 확인
- [ ] Chrom devtool MCP 를 통한 http://localhost:5173 홈페이지 경로로 접속하여 웹의 동작 상태 확인하여 문제 확인

# 수행 단계
- [ ] 당신은 SED (Spec-Exact Development) 방식을 엄격히 준수하며 스펙 ./specs/*.md 문서를 반드시 참고합니다.
- [ ] 당신은 vitest 를 통해서 테스트 가능한 로직/코드를 생성합니다. 그래서 pure functions 는 ./shared 폴더에 저장을 하고, 클라이언트에 depend 한 코드는 ./src/lib/* 로 로직을 분리합니다.
  - [ ] 당신은 모든 함수를 vitest 로 테스트 합니다. 테스트는 `./tests` 폴더에 생성하고 실행합니다.
    - [ ] 또한 테스트를 할 때에는 반드시 테스트 스펙 문서를 참고해서, 그대로 실행을 합니다.
- [ ] 처음으로 돌아가서 원점에서 다시 생각하고 필요하면 이미 존재하는 코드를 모두 삭제하고 처음 부터 완전히 다시 생성을 하세요.
- [ ] 가능한 모든 경우에서 Explore subagents 기능을 사용하여 high throughness 로 작업을 수행합니다. 개발자가 요청을 하지 않아도 모든 경우(개발 작업)에서 최대한의 subagents 를 사용하여 병렬(Parallel)로 작업을 작업을 수행합니다
- [ ] Firebase Cloud Functions 코드 `./firebase/functions/src` 작업이 끝난 다음 항상 `npm run deploy` 명령을 수행하여 배포를 합니다.
- [ ] 작업이 끝난 다음 항상 `npm run check` 명령을 수행하여 소스 코드를 검사하고, 발견된 모든 문제를 수정합니다. 

