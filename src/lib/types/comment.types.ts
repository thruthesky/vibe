/**
 * 댓글 관련 TypeScript 타입 정의
 *
 * 이 파일은 채팅 메시지에 달리는 댓글 시스템의 타입을 정의합니다.
 * 댓글은 계층적 구조(트리 구조)를 지원하며, listOrder 필드를 통해 정렬됩니다.
 */

/**
 * 채팅 메시지 댓글 인터페이스
 *
 * 경로: `/chat-message-comments/{messageId}/{commentId}`
 *
 * @property text - 댓글 내용
 * @property urls - 첨부 파일 URL 목록 (선택적)
 * @property authorUid - 댓글 작성자 UID
 * @property parentId - 부모 댓글 ID (최상위 댓글인 경우 null)
 * @property createdAt - 댓글 작성 시간 (밀리초 타임스탬프)
 * @property listOrder - 계층적 정렬을 위한 문자열 (예: "001", "001-01", "001-01-01")
 * @property childCount - 자식 댓글 개수 (Cloud Functions에서 자동 관리)
 * @property editedAt - 댓글 수정 시간 (선택적, 수정되지 않은 경우 null)
 * @property deletedAt - 댓글 삭제 시간 (선택적, 삭제되지 않은 경우 null)
 * @property deleted - 삭제 여부 (선택적, 소프트 삭제)
 */
export interface ChatMessageComment {
  text: string;
  urls?: Record<number, string>;
  authorUid: string;
  parentId: string | null;
  createdAt: number;
  listOrder: string;
  childCount?: number;
  editedAt?: number | null;
  deletedAt?: number | null;
  deleted?: boolean;
}

/**
 * 댓글 생성 요청 페이로드
 *
 * 클라이언트에서 댓글을 생성할 때 사용하는 최소 필드
 */
export interface CreateCommentPayload {
  text: string;
  urls?: Record<number, string>;
  authorUid: string;
  parentId: string | null;
  createdAt: number;
  listOrder: string;
}

/**
 * 댓글과 메타데이터를 포함하는 인터페이스
 *
 * UI에서 댓글을 표시할 때 사용 (댓글 ID, depth 등 추가 정보 포함)
 */
export interface CommentWithMetadata extends ChatMessageComment {
  commentId: string;
  depth: number;  // 댓글의 깊이 (0: 최상위, 1: 대댓글, 2: 손자 댓글, ...)
}

/**
 * 파일 업로드 상태 인터페이스 (재사용)
 *
 * 댓글 작성 시 파일 업로드 진행 상황을 추적하기 위해 사용
 */
export interface FileUploadStatus {
  file: File;
  progress: number;
  downloadUrl?: string;
  error?: string;
  completed: boolean;
}
