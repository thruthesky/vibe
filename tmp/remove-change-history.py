#!/usr/bin/env python3
"""
모든 SED 스펙 문서에서 변경 이력 섹션을 제거하는 스크립트

변경 이력 패턴:
- ## 변경 이력
- ## 변경사항
- ## 변경 사항
- ## Change History
- ## History
- ## Changelog
"""

import os
import re
from pathlib import Path

# 변경 이력 섹션 패턴 (대소문자 구분 없음)
HISTORY_PATTERNS = [
    r'^## 변경\s*이력',
    r'^## 변경\s*사항',
    r'^## Change\s+History',
    r'^## History',
    r'^## Changelog'
]

def remove_change_history(file_path: Path) -> bool:
    """
    파일에서 변경 이력 섹션을 제거합니다.

    Args:
        file_path: 처리할 마크다운 파일 경로

    Returns:
        bool: 변경 이력이 제거되었으면 True, 아니면 False
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # 변경 이력 섹션 시작 위치 찾기
        history_start_idx = None
        for i, line in enumerate(lines):
            for pattern in HISTORY_PATTERNS:
                if re.match(pattern, line.strip(), re.IGNORECASE):
                    history_start_idx = i
                    break
            if history_start_idx is not None:
                break

        # 변경 이력 섹션이 없으면 스킵
        if history_start_idx is None:
            return False

        # 변경 이력 섹션 이전까지만 유지
        new_lines = lines[:history_start_idx]

        # 파일 끝의 빈 줄 제거 (최대 1개의 빈 줄만 남김)
        while len(new_lines) > 1 and new_lines[-1].strip() == '' and new_lines[-2].strip() == '':
            new_lines.pop()

        # 파일에 쓰기
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)

        print(f"✅ 변경 이력 제거 완료: {file_path}")
        return True

    except Exception as e:
        print(f"❌ 에러 발생 ({file_path}): {e}")
        return False

def main():
    """메인 함수"""
    specs_dir = Path('/Users/thruthesky/apps/sonub/specs')

    # 모든 .md 파일 찾기
    md_files = list(specs_dir.rglob('*.md'))

    print(f"총 {len(md_files)}개의 마크다운 파일을 처리합니다...\n")

    modified_count = 0
    for md_file in md_files:
        if remove_change_history(md_file):
            modified_count += 1

    print(f"\n처리 완료: {modified_count}개 파일에서 변경 이력을 제거했습니다.")

if __name__ == '__main__':
    main()
