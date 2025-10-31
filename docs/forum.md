# 게시판 개발 가이드

본 문서는 게시판 기능을 개발하는 데 필요한 지침과 로직을 제공합니다.
게시판 관련 코드 작성을 할 때, 반드시 이 문서를 따라서 작성해야 합니다.

---

## 📋 목차

1. [게시판 주요 기능](#게시판-주요-기능)
2. [데이터베이스 구조](#데이터베이스-구조)
3. [카테고리 관리](#카테고리-관리)
4. [API 함수 (lib/forum.ts)](#api-함수-libforumts)
5. [페이지 구조 (app/forum/list/page.tsx)](#페이지-구조-appforumlistpagetsx)
6. [상세 구현 로직](#상세-구현-로직)
7. [보안 고려사항](#보안-고려사항)

---

## 게시판 주요 기능

### 1. 글 작성
- 사용자는 카테고리, 제목, 내용을 입력하여 새 글을 작성할 수 있습니다.
- 작성된 글은 Firebase RTDB에 실시간으로 저장됩니다.
- 로그인한 사용자만 글을 작성할 수 있습니다.
- 작성 시 모달 다이얼로그를 통해 입력받습니다.

### 2. 글 목록
- 작성된 글은 카테고리별로 목록 형태로 표시됩니다.
- 실시간 리스너를 통해 새 글이 자동으로 목록에 반영됩니다.
- 최신 10개의 게시글을 표시합니다.
- 게시글이 없는 경우 "게시글이 없습니다" 메시지 표시

### 3. 글 수정 (향후 구현)
- 사용자는 자신이 작성한 글을 수정할 수 있습니다.
- 수정된 글은 데이터베이스에 업데이트됩니다.

### 4. 글 삭제 (향후 구현)
- 사용자는 자신이 작성한 글을 삭제할 수 있습니다.
- 삭제된 글은 데이터베이스에서 제거됩니다.

---

## 데이터베이스 구조

### Firebase Realtime Database (RTDB) 사용

**RTDB를 사용하는 이유:**
1. **실시간 동기화**: 게시글 쓰기, 수정, 삭제 시 실시간으로 반영되어 사용자 경험 향상
2. **간편한 데이터 구조**: 계층적 데이터 저장이 용이하여 게시판 구조에 적합
3. **확장성**: 사용자 수 증가에 따른 확장 용이

### 게시판 데이터 구조

모든 경로는 항상 상수 변수 `ROOT_FOLDER` (예: `/vibe`) 아래에 생성됩니다.

```
/{ROOT_FOLDER}/
  forums/
    {category}/              # 카테고리 (community, qna, news, market)
      posts/
        {postId}/            # Firebase 자동 생성 ID
          uid: "사용자 UID"
          title: "게시글 제목"
          content: "게시글 내용"
          author: "작성자 displayName"
          category: "카테고리"
          createdAt: 1234567890  # Unix timestamp (밀리초)
          updatedAt: 1234567890  # Unix timestamp (밀리초)
```

**예시 경로:**
```
/vibe/forums/community/posts/abc123def456/
/vibe/forums/qna/posts/xyz789uvw012/
/vibe/forums/news/posts/mno345pqr678/
```

---

## 카테고리 관리

### 카테고리 설정 파일

카테고리는 `app/app.config.ts`에서 중앙 관리됩니다.

```typescript
// app/app.config.ts
export const FORUM_CATEGORIES = [
  { value: "community", label: "커뮤니티" },
  { value: "qna", label: "질문과답변" },
  { value: "news", label: "뉴스" },
  { value: "market", label: "회원장터" },
] as const;
```

### 카테고리 사용 방법

```typescript
import { FORUM_CATEGORIES } from "@/app/app.config";

// Select 드롭다운에서 사용
{FORUM_CATEGORIES.map((category) => (
  <SelectItem key={category.value} value={category.value}>
    {category.label}
  </SelectItem>
))}

// 카테고리 탭에서 사용
{FORUM_CATEGORIES.map((category) => (
  <Link
    key={category.value}
    href={`/forum/list?category=${category.value}`}
    className={currentCategory === category.value ? "active" : ""}
  >
    {category.label}
  </Link>
))}
```

---

## API 함수 (lib/forum.ts)

### ForumPost 인터페이스

```typescript
export interface ForumPost {
  postId?: string;       // Firebase 자동 생성 ID
  uid: string;           // 작성자 UID
  title: string;         // 게시글 제목
  content: string;       // 게시글 내용
  author: string;        // 작성자 displayName
  category: string;      // 카테고리
  createdAt: number;     // 작성 시간 (Unix timestamp)
  updatedAt: number;     // 수정 시간 (Unix timestamp)
}
```

### 주요 함수

#### 1. createPost() - 게시글 작성

```typescript
export async function createPost(
  category: string,
  uid: string,
  author: string,
  title: string,
  content: string
): Promise<{ success: boolean; postId?: string; error?: string }>
```

**기능:**
- 새 게시글을 Firebase RTDB에 저장
- 자동으로 postId 생성 (Firebase push key)
- createdAt, updatedAt 자동 설정

**사용 예시:**
```typescript
const result = await createPost(
  "community",
  "user-uid-123",
  "홍길동",
  "첫 번째 게시글",
  "안녕하세요! 첫 게시글입니다."
);

if (result.success) {
  console.log("게시글 ID:", result.postId);
}
```

#### 2. listenToPosts() - 게시글 실시간 리스너

```typescript
export function listenToPosts(
  category: string,
  limit: number = 10,
  callback: (posts: ForumPost[]) => void
): () => void
```

**기능:**
- 특정 카테고리의 게시글을 실시간으로 감시
- 최신 N개의 게시글을 가져옴 (기본값: 10개)
- 데이터 변경 시 자동으로 callback 호출
- Unsubscribe 함수 반환 (메모리 누수 방지)

**사용 예시:**
```typescript
useEffect(() => {
  const unsubscribe = listenToPosts("community", 10, (posts) => {
    console.log("게시글 목록:", posts);
    setPosts(posts);
  });

  // 컴포넌트 언마운트 시 리스너 해제
  return () => unsubscribe();
}, []);
```

#### 3. updatePost() - 게시글 수정 (향후 구현)

```typescript
export async function updatePost(
  category: string,
  postId: string,
  updates: { title?: string; content?: string }
): Promise<{ success: boolean; error?: string }>
```

#### 4. deletePost() - 게시글 삭제 (향후 구현)

```typescript
export async function deletePost(
  category: string,
  postId: string
): Promise<{ success: boolean; error?: string }>
```

---

## 페이지 구조 (app/forum/list/page.tsx)

### 페이지 개요

**경로:** `/forum/list?category={category}`

**주요 기능:**
1. 카테고리별 게시글 목록 표시
2. 카테고리 탭 네비게이션
3. 글쓰기 모달 다이얼로그
4. 실시간 게시글 동기화

### 컴포넌트 구조

```tsx
<div className="min-h-screen">
  <div className="container">
    {/* 헤더 영역 */}
    <div className="flex justify-between">
      <h1>포럼</h1>
      <Button>글쓰기</Button>
    </div>

    {/* 카테고리 탭 */}
    <div className="flex gap-2">
      {FORUM_CATEGORIES.map((category) => (
        <Link href={`/forum/list?category=${category.value}`}>
          {category.label}
        </Link>
      ))}
    </div>

    {/* 게시글 목록 */}
    {posts.length === 0 ? (
      <div>게시글이 없습니다</div>
    ) : (
      <div>
        {posts.map((post) => (
          <div key={post.postId}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <span>작성자: {post.author}</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* 글쓰기 모달 다이얼로그 */}
  <Dialog open={isDialogOpen}>
    <DialogContent>
      <Select value={postCategory} onValueChange={setPostCategory}>
        {/* 카테고리 선택 */}
      </Select>
      <Input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} />
      <Textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} />
      <Button onClick={handleSubmit}>전송</Button>
    </DialogContent>
  </Dialog>
</div>
```

---

## 상세 구현 로직

### 1. 상태 관리

```typescript
const [userId, setUserId] = useState<string | null>(null);
const [userName, setUserName] = useState<string>("");
const [authLoading, setAuthLoading] = useState(true);

// 현재 카테고리 (쿼리 파라미터에서 가져옴)
const currentCategory = searchParams.get("category") || "community";

// 글쓰기 모달 상태
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [postCategory, setPostCategory] = useState("");
const [postTitle, setPostTitle] = useState("");
const [postContent, setPostContent] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

// 게시글 목록 상태
const [posts, setPosts] = useState<ForumPost[]>([]);
```

### 2. 인증 상태 확인

**중요:** 페이지 새로고침 시 인증 상태를 올바르게 처리하기 위해 `authLoading` 상태를 사용합니다.

```typescript
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      setUserId(user.uid);
      // 사용자 이름 가져오기
      const displayName = await getUserDisplayName(user.uid);
      setUserName(displayName || user.displayName || user.email || "익명");
    }
    // ⚠️ 중요: 인증 상태 확인 완료
    setAuthLoading(false);
  });

  return () => unsubscribe();
}, []);

// authLoading이 true일 때는 로딩 화면 표시
if (authLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>로딩 중...</p>
    </div>
  );
}
```

### 3. 게시글 실시간 리스너

```typescript
useEffect(() => {
  // 현재 카테고리의 게시글 목록 리스너 설정
  const unsubscribe = listenToPosts(currentCategory, 10, (posts) => {
    setPosts(posts);
  });

  // ⚠️ 중요: 컴포넌트 언마운트 시 리스너 해제 (메모리 누수 방지)
  return () => unsubscribe();
}, [currentCategory]); // currentCategory 변경 시 리스너 재설정
```

### 4. 글쓰기 버튼 클릭 핸들러

```typescript
const handleCreatePost = () => {
  if (!userId) {
    // 로그인하지 않은 경우 로그인 페이지로 이동
    router.push("/auth/login");
    return;
  }
  // 글쓰기 모달 열기
  setIsDialogOpen(true);
};
```

### 5. 글쓰기 전송 핸들러

```typescript
const handleSubmit = async () => {
  // 1. 입력 유효성 검사
  if (!postCategory) {
    alert("카테고리를 선택해주세요.");
    return;
  }
  if (!postTitle.trim()) {
    alert("제목을 입력해주세요.");
    return;
  }
  if (!postContent.trim()) {
    alert("내용을 입력해주세요.");
    return;
  }

  if (!userId || !userName) {
    alert("로그인 정보를 확인할 수 없습니다.");
    return;
  }

  // 2. 전송 중 상태 활성화
  setIsSubmitting(true);

  try {
    // 3. Firebase RTDB에 게시글 저장
    const result = await createPost(
      postCategory,
      userId,
      userName,
      postTitle,
      postContent
    );

    if (result.success) {
      // 4. 모달 닫기 및 초기화
      setIsDialogOpen(false);
      setPostCategory("");
      setPostTitle("");
      setPostContent("");

      // 5. 해당 카테고리 페이지로 이동
      router.push(`/forum/list?category=${postCategory}`);
    } else {
      alert(`게시글 저장 실패: ${result.error}`);
    }
  } catch (error) {
    console.error("게시글 저장 오류:", error);
    alert("게시글 저장 중 오류가 발생했습니다.");
  } finally {
    // 6. 전송 중 상태 해제
    setIsSubmitting(false);
  }
};
```

### 6. 카테고리 탭 네비게이션

```typescript
{FORUM_CATEGORIES.map((category) => (
  <Link
    key={category.value}
    href={`/forum/list?category=${category.value}`}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      currentCategory === category.value
        ? "bg-slate-900 text-white"           // 활성 탭
        : "text-slate-600 hover:bg-slate-100" // 비활성 탭
    }`}
  >
    {category.label}
  </Link>
))}
```

### 7. 게시글 목록 렌더링

```typescript
{posts.length === 0 ? (
  // 게시글이 없는 경우
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-12">
    <div className="text-center">
      <p className="text-muted-foreground text-base">
        게시글이 없습니다
      </p>
      <p className="text-muted-foreground text-sm mt-2">
        첫 번째 게시글을 작성해보세요!
      </p>
    </div>
  </div>
) : (
  // 게시글 목록
  <div className="space-y-4">
    {posts.map((post) => (
      <div
        key={post.postId}
        className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {post.title}
        </h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {post.content}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>작성자: {post.author}</span>
            <span>
              {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
```

---

## 보안 고려사항

### Firebase Realtime Database 보안 규칙

```json
{
  "rules": {
    "vibe": {
      "forums": {
        "$category": {
          "posts": {
            ".read": true,
            "$postId": {
              ".write": "auth != null && (!data.exists() || data.child('uid').val() === auth.uid)",
              ".validate": "newData.hasChildren(['uid', 'title', 'content', 'author', 'category', 'createdAt', 'updatedAt'])"
            }
          }
        }
      }
    }
  }
}
```

**보안 규칙 설명:**
- `.read`: 모든 사용자가 게시글을 읽을 수 있음
- `.write`: 로그인한 사용자만 글 작성 가능, 본인이 작성한 글만 수정/삭제 가능
- `.validate`: 필수 필드 검증

### 클라이언트 측 입력 유효성 검사

1. **빈 값 검사**: 카테고리, 제목, 내용이 비어있지 않은지 확인
2. **인증 확인**: userId와 userName이 존재하는지 확인
3. **중복 제출 방지**: isSubmitting 상태로 중복 클릭 방지

---

## 향후 개발 계획

### 1. 게시글 상세 페이지
- **경로**: `/forum/post/{postId}`
- **기능**: 게시글 전체 내용 표시, 수정/삭제 버튼

### 2. 게시글 수정 기능
- 본인이 작성한 글만 수정 가능
- 수정 시 `updatedAt` 필드 자동 업데이트

### 3. 게시글 삭제 기능
- 본인이 작성한 글만 삭제 가능
- 삭제 확인 다이얼로그

### 4. 댓글 기능
- 게시글에 댓글 작성, 수정, 삭제
- 실시간 댓글 동기화

### 5. 좋아요/싫어요 기능
- 게시글에 좋아요/싫어요 추가
- 중복 방지 (한 사용자당 한 번만)

### 6. 검색 및 필터링
- 제목, 내용, 작성자로 검색
- 날짜 범위 필터링

### 7. 페이지네이션
- 무한 스크롤 또는 페이지 번호
- 더보기 버튼

### 8. 이미지 업로드
- Firebase Storage 사용
- 이미지 미리보기

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0
