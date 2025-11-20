#!/usr/bin/env node

/**
 * specs/index.md에 Complete Source Code Specs 섹션 생성 스크립트
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SPECS_REPO_DIR = path.join(PROJECT_ROOT, 'specs', 'repository');
const INDEX_MD_PATH = path.join(PROJECT_ROOT, 'specs', 'index.md');

/**
 * 파일을 카테고리별로 분류
 */
function categorizeFiles(files) {
  const categories = {
    '설정 파일 (Configuration)': [],
    'Svelte 페이지 (Routes)': [],
    'Svelte 컴포넌트 (Components)': [],
    'Svelte 라이브러리 (Libraries)': [],
    'Firebase Cloud Functions - Handlers': [],
    'Firebase Cloud Functions - Utils': [],
    'Firebase Cloud Functions - 기타': [],
    '공유 코드 (Shared)': [],
    '스타일 (Styles)': [],
    '기타 (Others)': [],
  };

  files.forEach(file => {
    // 상대 경로로 변환
    const relPath = path.relative(SPECS_REPO_DIR, file);

    if (relPath.endsWith('.json.md')) {
      categories['설정 파일 (Configuration)'].push(relPath);
    } else if (relPath.includes('src/routes/')) {
      categories['Svelte 페이지 (Routes)'].push(relPath);
    } else if (relPath.includes('src/lib/components/')) {
      categories['Svelte 컴포넌트 (Components)'].push(relPath);
    } else if (relPath.includes('src/lib/')) {
      categories['Svelte 라이브러리 (Libraries)'].push(relPath);
    } else if (relPath.includes('firebase/functions/src/handlers/')) {
      categories['Firebase Cloud Functions - Handlers'].push(relPath);
    } else if (relPath.includes('firebase/functions/src/utils/')) {
      categories['Firebase Cloud Functions - Utils'].push(relPath);
    } else if (relPath.includes('firebase/functions/src/')) {
      categories['Firebase Cloud Functions - 기타'].push(relPath);
    } else if (relPath.includes('shared/')) {
      categories['공유 코드 (Shared)'].push(relPath);
    } else if (relPath.endsWith('.css.md')) {
      categories['스타일 (Styles)'].push(relPath);
    } else {
      categories['기타 (Others)'].push(relPath);
    }
  });

  // 각 카테고리 내에서 정렬
  for (const category in categories) {
    categories[category].sort();
  }

  return categories;
}

/**
 * Markdown 섹션 생성
 */
function generateMarkdownSection(categories) {
  let markdown = '\n## Complete Source Code Specs\n\n';
  markdown += '이 섹션은 Sonub 프로젝트의 모든 소스 코드를 SED 스펙 형식으로 문서화한 것입니다.\n\n';
  markdown += '**목적**: 스펙만으로 완전히 동일한 (또는 매우 비슷한) 웹/앱을 만들어 낼 수 있도록 모든 소스 코드를 포함합니다.\n\n';

  // 통계
  let totalFiles = 0;
  for (const category in categories) {
    totalFiles += categories[category].length;
  }
  markdown += `**총 스펙 파일 수**: ${totalFiles}개\n\n`;
  markdown += `**마지막 업데이트**: ${new Date().toISOString().split('T')[0]}\n\n`;

  markdown += '---\n\n';

  // 카테고리별로 나열
  for (const [category, files] of Object.entries(categories)) {
    if (files.length === 0) continue;

    markdown += `### ${category}\n\n`;
    markdown += `파일 수: ${files.length}개\n\n`;

    files.forEach(file => {
      // 원본 파일 경로 (상대 경로)
      const originalPath = file.replace(/\.md$/, '');
      const specPath = `specs/repository/${file}`;

      markdown += `- [\`${originalPath}\`](${specPath})\n`;
    });

    markdown += '\n';
  }

  return markdown;
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('📝 specs/index.md 업데이트 시작\n');

  // 모든 스펙 파일 찾기
  const findCommand = `find "${SPECS_REPO_DIR}" -type f -name "*.md" | sort`;
  const output = execSync(findCommand, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const files = output.trim().split('\n').filter(f => f);

  console.log(`✅ ${files.length}개의 스펙 파일을 찾았습니다.\n`);

  // 카테고리별로 분류
  const categories = categorizeFiles(files);

  // Markdown 섹션 생성
  const markdownSection = generateMarkdownSection(categories);

  // 기존 index.md 읽기
  let indexContent = '';
  if (fs.existsSync(INDEX_MD_PATH)) {
    indexContent = fs.readFileSync(INDEX_MD_PATH, 'utf8');
  }

  // "Complete Source Code Specs" 섹션 제거 (기존에 있다면)
  const sectionStart = indexContent.indexOf('## Complete Source Code Specs');
  if (sectionStart !== -1) {
    // 다음 ## 섹션까지 또는 파일 끝까지 제거
    const nextSectionMatch = indexContent.substring(sectionStart + 1).match(/\n## /);
    const sectionEnd = nextSectionMatch
      ? sectionStart + nextSectionMatch.index + 1
      : indexContent.length;

    indexContent = indexContent.substring(0, sectionStart) + indexContent.substring(sectionEnd);
  }

  // 새로운 섹션 추가
  indexContent = indexContent.trim() + '\n' + markdownSection;

  // 파일 저장
  fs.writeFileSync(INDEX_MD_PATH, indexContent, 'utf8');

  console.log(`✅ specs/index.md 업데이트 완료!\n`);
  console.log(`📄 파일 경로: ${INDEX_MD_PATH}\n`);

  // 통계 출력
  console.log('📊 카테고리별 통계:');
  for (const [category, files] of Object.entries(categories)) {
    if (files.length > 0) {
      console.log(`   - ${category}: ${files.length}개`);
    }
  }
}

// 스크립트 실행
main();
