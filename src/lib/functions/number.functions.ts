/**
 * 공통 숫자 포맷 함수
 * - 천 단위 콤마를 적용하여 가독성을 높입니다.
 * - 값이 없거나 숫자가 아니면 fallback 값을 대신 포맷합니다.
 */
const commaFormatter = new Intl.NumberFormat('ko-KR');

export function formatNumberWithComma(value: unknown, fallback = 0): string {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return commaFormatter.format(numeric);
}
