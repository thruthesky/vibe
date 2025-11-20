#!/usr/bin/env node

/**
 * SED 소스 코드 스펙 자동 생성 스크립트
 *
 * 목적:
 * - Sonub 프로젝트의 모든 소스 코드를 SED 스펙 문서로 변환
 * - specs/repository 폴더에 원래 경로 구조를 유지하며 저장
 *
 * 실행 방법:
 * node tmp/generate-source-specs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 프로젝트 루트 경로
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SPECS_REPO_DIR = path.join(PROJECT_ROOT, 'specs', 'repository');

// 제외할 폴더/파일 패턴
const EXCLUDE_PATTERNS = [
  '*/node_modules/*',
  '*/.svelte-kit/*',
  '*/build/*',
  '*/dist/*',
  '*/lib/*',  // 빌드 산출물
  '*/.claude/*',
  '*/.github/*',
  '*/.vscode/*',
  '*/.storybook/*',
  '*/specs/*',
  '*/tmp/*',
  '*/test/*',
  '*/tests/*',
  '*/project.inlang/*',
  '*.d.ts',  // 타입 정의 파일
  'package-lock.json',
  '.env*',
  '.*',  // 숨김 파일
  '*-service-account-key.json',  // 보안 파일
];

// 포함할 파일 확장자
const INCLUDE_EXTENSIONS = ['.svelte', '.ts', '.js', '.json', '.css', '.html'];

/**
 * 파일 타입별 설명 가져오기
 */
function getFileTypeDescription(ext) {
  const descriptions = {
    '.svelte': 'Svelte 5 컴포넌트',
    '.ts': 'TypeScript 소스 코드',
    '.js': 'JavaScript 소스 코드',
    '.json': 'JSON 설정 파일',
    '.css': 'CSS 스타일시트',
    '.html': 'HTML 문서',
  };
  return descriptions[ext] || '소스 파일';
}

/**
 * 파일 카테고리 가져오기
 */
function getFileCategory(filePath) {
  if (filePath.includes('/routes/')) return 'route';
  if (filePath.includes('/lib/')) return 'library';
  if (filePath.includes('/components/')) return 'component';
  if (filePath.includes('/functions/src/')) return 'cloud-function';
  if (filePath.includes('/handlers/')) return 'handler';
  if (filePath.includes('/utils/')) return 'utility';
  if (filePath.endsWith('.json')) return 'configuration';
  if (filePath.endsWith('.css')) return 'style';
  return 'source';
}

/**
 * SED 스펙 YAML 헤더 생성
 */
function generateYamlHeader(filePath, relPath) {
  const ext = path.extname(filePath);
  const fileType = getFileTypeDescription(ext);
  const category = getFileCategory(relPath);

  return `---
title: ${path.basename(filePath)} - ${fileType}
original_path: ${relPath}
category: ${category}
file_type: ${ext.substring(1)}
status: current
last_updated: ${new Date().toISOString().split('T')[0]}
---

`;
}

/**
 * SED 스펙 파일 생성
 */
function generateSpecFile(sourceFilePath, relPath) {
  try {
    // 파일 읽기
    const content = fs.readFileSync(sourceFilePath, 'utf8');
    const ext = path.extname(sourceFilePath);

    // YAML 헤더 생성
    const yamlHeader = generateYamlHeader(sourceFilePath, relPath);

    // 스펙 문서 내용 생성
    let specContent = yamlHeader;
    specContent += `# ${path.basename(sourceFilePath)}\n\n`;
    specContent += `## 개요\n\n`;
    specContent += `**원본 경로**: \`${relPath}\`\n\n`;
    specContent += `**파일 유형**: ${getFileTypeDescription(ext)}\n\n`;
    specContent += `## 소스 코드\n\n`;

    // 코드 블록으로 감싸기
    const lang = ext === '.svelte' ? 'svelte' :
                 ext === '.ts' ? 'typescript' :
                 ext === '.js' ? 'javascript' :
                 ext === '.json' ? 'json' :
                 ext === '.css' ? 'css' :
                 ext === '.html' ? 'html' : '';

    specContent += `\`\`\`${lang}\n`;
    specContent += content;
    if (!content.endsWith('\n')) {
      specContent += '\n';
    }
    specContent += `\`\`\`\n`;

    return specContent;
  } catch (error) {
    console.error(`❌ 파일 읽기 실패: ${sourceFilePath}`, error.message);
    return null;
  }
}

/**
 * 모든 소스 파일 찾기
 */
function findSourceFiles() {
  console.log('🔍 소스 파일 검색 중...\n');

  // find 명령어 구성
  const extPatterns = INCLUDE_EXTENSIONS.map(ext => `-name "*${ext}"`).join(' -o ');
  const excludePatterns = EXCLUDE_PATTERNS.map(pattern => `! -path "${pattern}"`).join(' ');

  const findCommand = `find "${PROJECT_ROOT}" -type f \\( ${extPatterns} \\) ${excludePatterns}`;

  try {
    const output = execSync(findCommand, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const files = output.trim().split('\n').filter(f => f);

    console.log(`✅ 총 ${files.length}개의 소스 파일을 찾았습니다.\n`);
    return files;
  } catch (error) {
    console.error('❌ 파일 검색 실패:', error.message);
    return [];
  }
}

/**
 * 스펙 파일 저장
 */
function saveSpecFile(sourceFilePath, specContent) {
  // 상대 경로 계산
  const relPath = path.relative(PROJECT_ROOT, sourceFilePath);

  // 스펙 파일 경로 생성 (원본 경로 + .md)
  const specFilePath = path.join(SPECS_REPO_DIR, relPath + '.md');

  // 디렉토리 생성
  const specDir = path.dirname(specFilePath);
  if (!fs.existsSync(specDir)) {
    fs.mkdirSync(specDir, { recursive: true });
  }

  // 파일 저장
  try {
    fs.writeFileSync(specFilePath, specContent, 'utf8');
    return { success: true, path: specFilePath };
  } catch (error) {
    console.error(`❌ 스펙 파일 저장 실패: ${specFilePath}`, error.message);
    return { success: false, path: specFilePath, error: error.message };
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🚀 SED 소스 코드 스펙 자동 생성 시작\n');
  console.log('='.repeat(60) + '\n');

  // specs/repository 폴더 생성
  if (!fs.existsSync(SPECS_REPO_DIR)) {
    fs.mkdirSync(SPECS_REPO_DIR, { recursive: true });
    console.log(`✅ 스펙 디렉토리 생성: ${SPECS_REPO_DIR}\n`);
  }

  // 소스 파일 찾기
  const sourceFiles = findSourceFiles();

  if (sourceFiles.length === 0) {
    console.log('⚠️  변환할 소스 파일이 없습니다.');
    return;
  }

  // 진행 상황 추적
  let successCount = 0;
  let failCount = 0;
  const results = [];

  console.log('📝 스펙 파일 생성 중...\n');

  // 각 소스 파일을 스펙으로 변환
  sourceFiles.forEach((sourceFilePath, index) => {
    const relPath = path.relative(PROJECT_ROOT, sourceFilePath);

    // 진행률 표시 (매 50개마다)
    if ((index + 1) % 50 === 0) {
      console.log(`   진행: ${index + 1}/${sourceFiles.length} (${Math.round((index + 1) / sourceFiles.length * 100)}%)`);
    }

    // 스펙 콘텐츠 생성
    const specContent = generateSpecFile(sourceFilePath, relPath);

    if (specContent) {
      // 스펙 파일 저장
      const result = saveSpecFile(sourceFilePath, specContent);

      if (result.success) {
        successCount++;
        results.push({
          original: relPath,
          spec: path.relative(PROJECT_ROOT, result.path),
          success: true,
        });
      } else {
        failCount++;
        results.push({
          original: relPath,
          error: result.error,
          success: false,
        });
      }
    } else {
      failCount++;
      results.push({
        original: relPath,
        error: '콘텐츠 생성 실패',
        success: false,
      });
    }
  });

  // 결과 출력
  console.log('\n' + '='.repeat(60));
  console.log('✅ 스펙 생성 완료!\n');
  console.log(`📊 통계:`);
  console.log(`   - 전체: ${sourceFiles.length}개`);
  console.log(`   - 성공: ${successCount}개`);
  console.log(`   - 실패: ${failCount}개`);
  console.log('='.repeat(60) + '\n');

  // 결과 파일 저장
  const resultFilePath = path.join(PROJECT_ROOT, 'tmp', 'spec-generation-results.json');
  fs.writeFileSync(resultFilePath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`📄 상세 결과: ${resultFilePath}\n`);

  if (failCount > 0) {
    console.log('⚠️  일부 파일 변환 실패. 상세 내용은 결과 파일을 확인하세요.');
  }
}

// 스크립트 실행
main();
