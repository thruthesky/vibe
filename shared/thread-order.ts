/**
 * 댓글 계층 구조를 위한 Thread Order 생성 함수
 *
 * 이 파일은 클라이언트(Svelte)와 서버(Cloud Functions) 양쪽에서 사용 가능한
 * 순수 함수(pure function)를 제공합니다.
 *
 * listOrder 형식:
 * - 최상위 댓글: "001", "002", ..., "999" (3자리 zero-padding)
 * - 대댓글 (2단계): "001-01", "001-02", ..., "001-99" (2자리 zero-padding)
 * - 손자 댓글 (3단계): "001-01-01", "001-01-02", ..., "001-01-99"
 *
 * 최대값 제한:
 * - 최상위: 999개까지, 초과 시 999로 고정
 * - 하위: 99개까지, 초과 시 99로 고정
 */

/**
 * 새로운 댓글의 listOrder 값을 childCount 기반으로 생성합니다.
 *
 * @param parentListOrder - 부모 댓글의 listOrder (최상위 댓글인 경우 null)
 * @param parentChildCount - 부모의 현재 childCount 값 (기존 자식 댓글 개수)
 * @returns 새로운 댓글의 listOrder 문자열
 *
 * @example
 * // 최상위 댓글 생성 (기존 댓글 없음, parentChildCount = 0)
 * generateThreadOrder(null, 0) // "001"
 *
 * @example
 * // 최상위 댓글 생성 (기존 댓글 2개, parentChildCount = 2)
 * generateThreadOrder(null, 2) // "003"
 *
 * @example
 * // 대댓글 생성 (부모: "001", 기존 대댓글 없음, parentChildCount = 0)
 * generateThreadOrder("001", 0) // "001-01"
 *
 * @example
 * // 대댓글 생성 (부모: "001", 기존 대댓글 2개, parentChildCount = 2)
 * generateThreadOrder("001", 2) // "001-03"
 *
 * @example
 * // 손자 댓글 생성 (부모: "001-01", 기존 손자 댓글 1개, parentChildCount = 1)
 * generateThreadOrder("001-01", 1) // "001-01-02"
 *
 * @example
 * // 최대값 제한 적용 (최상위 댓글 999개 초과)
 * generateThreadOrder(null, 999) // "999"
 *
 * @example
 * // 최대값 제한 적용 (대댓글 99개 초과)
 * generateThreadOrder("001", 99) // "001-99"
 */
export function generateThreadOrder(
  parentListOrder: string | null,
  parentChildCount: number
): string {
  // 최상위 댓글인 경우
  if (parentListOrder === null || parentListOrder === '') {
    return generateTopLevelOrder(parentChildCount);
  }

  // 하위 댓글인 경우 (대댓글, 손자 댓글 등)
  return generateNestedOrder(parentListOrder, parentChildCount);
}

/**
 * 최상위 댓글의 listOrder를 childCount 기반으로 생성합니다.
 *
 * @param currentChildCount - 현재 childCount 값 (기존 최상위 댓글 개수)
 * @returns 새로운 최상위 댓글의 listOrder (3자리 zero-padding)
 */
function generateTopLevelOrder(currentChildCount: number): string {
  // childCount가 0이면 첫 번째 댓글 → "001"
  // childCount가 1이면 두 번째 댓글 → "002"
  // childCount가 2이면 세 번째 댓글 → "003"
  // 즉, nextOrder = currentChildCount + 1

  // 다음 순서 번호 계산 (최소 1, 최대 999까지)
  const nextOrder = Math.min(Math.max(currentChildCount + 1, 1), 999);

  // 3자리 zero-padding
  return nextOrder.toString().padStart(3, '0');
}

/**
 * 하위 댓글(대댓글, 손자 댓글 등)의 listOrder를 childCount 기반으로 생성합니다.
 *
 * @param parentListOrder - 부모 댓글의 listOrder
 * @param parentChildCount - 부모의 현재 childCount 값 (기존 자식 댓글 개수)
 * @returns 새로운 하위 댓글의 listOrder
 */
function generateNestedOrder(
  parentListOrder: string,
  parentChildCount: number
): string {
  // 부모의 listOrder 뒤에 "-XX" 형식으로 붙임
  const prefix = `${parentListOrder}-`;

  // childCount가 0이면 첫 번째 자식 댓글 → "01"
  // childCount가 1이면 두 번째 자식 댓글 → "02"
  // childCount가 2이면 세 번째 자식 댓글 → "03"
  // 즉, nextOrder = parentChildCount + 1

  // 다음 순서 번호 계산 (최소 1, 최대 99까지)
  const nextOrder = Math.min(Math.max(parentChildCount + 1, 1), 99);

  // 2자리 zero-padding
  return `${prefix}${nextOrder.toString().padStart(2, '0')}`;
}

/**
 * listOrder 문자열에서 댓글의 깊이(depth)를 계산합니다.
 *
 * @param listOrder - 댓글의 listOrder
 * @returns 댓글의 깊이 (0: 최상위, 1: 대댓글, 2: 손자 댓글, ...)
 *
 * @example
 * getDepthFromListOrder("001") // 0
 * getDepthFromListOrder("001-01") // 1
 * getDepthFromListOrder("001-01-01") // 2
 */
export function getDepthFromListOrder(listOrder: string): number {
  if (!listOrder) return 0;

  // 하이픈의 개수 = 깊이
  const dashCount = (listOrder.match(/-/g) || []).length;
  return dashCount;
}
