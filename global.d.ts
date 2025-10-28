// TypeScript 전역 타입 선언 파일
// CSS 및 기타 모듈 import를 위한 타입 선언

// CSS 파일 import 허용
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// CSS 모듈 파일 import 허용
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// 기타 이미지 파일 타입 선언
declare module "*.svg" {
  const content: any;
  export default content;
}

declare module "*.png" {
  const content: any;
  export default content;
}

declare module "*.jpg" {
  const content: any;
  export default content;
}

declare module "*.jpeg" {
  const content: any;
  export default content;
}

declare module "*.gif" {
  const content: any;
  export default content;
}

declare module "*.webp" {
  const content: any;
  export default content;
}
