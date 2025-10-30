파이어베이스 클라우드 함수 (Firebase Cloud Functions) 개발 지침:
- 파이어베이스 클라우드 함수 개발을 할 때 꼭 지켜야하는 지침들을 모아놓은 문서입니다.


## 목차
- [목차](#목차)
- [1. 개요](#1-개요)
- [2. 개발 환경 설정](#2-개발-환경-설정)



## 1. 개요


파이어베이스 클라우드 함수는 서버리스 환경에서 백엔드 코드를 실행할 수 있는 기능을 제공합니다. 이 문서에서는 파이어베이스 클라우드 함수를 개발할 때 따라야 할 지침들을 안내합니다.



## 2. 개발 환경 설정

- Firebase CLI 및 Firebase Cloud Functions SDK 설치는 이미 설치되어져 있습니다.
- 파이어베이스 경로: `./firebase/` 폴더에 Firebase 관련 설정, 파일, 코드 등이 위치합니다.
- Firebase Cloud Functions 설치된 경로: `./firebase/functions/` 폴더에 클라우드 함수 코드가 위치합니다. 이 폴더에 필요한 모든 모듈이 설치되어져 있으며, `package.json` 파일이 존재합니다.
- Firebase Cloud Functions 시작 스크립트: `./firebase/functions/src/index.ts` 파일이 클라우드 함수의 진입점입니다.
- Node.js 및 Firebase CLI 설치. 참고: 공식문서: https://firebase.google.com/docs/functions/get-started
- Firebase 프로젝트 생성 및 초기화. 참고: https://firebase.google.com/docs/functions/get-started