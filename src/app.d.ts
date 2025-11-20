// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// 뒤로가기 시 직전 채팅 목록 탭 경로를 보존하기 위한 상태 필드
		interface PageState {
			from?: string;
		}
		// interface Platform {}
	}
}

export {};
