"use client";

// 게시판 목록 페이지
// 게시글 목록을 표시하고, 새 게시글을 작성할 수 있는 페이지입니다.
// 현재는 게시글이 없으므로 "게시글이 없습니다" 메시지를 표시합니다.

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { createPost, listenToPosts, type ForumPost } from "@/lib/forum";
import { getUserDisplayName } from "@/lib/user";
import { FORUM_CATEGORIES } from "@/app/app.config";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquarePlus } from "lucide-react";

export default function ForumListPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);

  // 쿼리 파라미터에서 카테고리 가져오기
  const currentCategory = searchParams.get("category") || "community";

  // 글쓰기 모달 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [postCategory, setPostCategory] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 게시글 목록 상태
  const [posts, setPosts] = useState<ForumPost[]>([]);

  // Firebase 인증 상태 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        // 사용자 이름 가져오기
        const displayName = await getUserDisplayName(user.uid);
        setUserName(displayName || user.displayName || user.email || "익명");
      }
      // 인증 상태 확인 완료
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 게시글 목록 실시간 리스너
  useEffect(() => {
    // 현재 카테고리의 게시글 목록 리스너 설정
    const unsubscribe = listenToPosts(currentCategory, 10, (posts) => {
      setPosts(posts);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [currentCategory]);

  // 인증 상태 확인 중일 때 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  // 게시글 작성 버튼 클릭 핸들러
  const handleCreatePost = () => {
    if (!userId) {
      // 로그인하지 않은 경우 로그인 페이지로 이동
      router.push("/auth/login");
      return;
    }
    // 글쓰기 모달 열기
    setIsDialogOpen(true);
  };

  // 글쓰기 모달 취소 핸들러
  const handleCancel = () => {
    setIsDialogOpen(false);
    setPostCategory("");
    setPostTitle("");
    setPostContent("");
  };

  // 글쓰기 전송 핸들러
  const handleSubmit = async () => {
    if (!postCategory) {
      alert(t("forum.alert.selectCategory"));
      return;
    }
    if (!postTitle.trim()) {
      alert(t("forum.alert.enterTitle"));
      return;
    }
    if (!postContent.trim()) {
      alert(t("forum.alert.enterContent"));
      return;
    }

    if (!userId || !userName) {
      alert(t("forum.alert.noAuth"));
      return;
    }

    // 전송 중 상태 활성화
    setIsSubmitting(true);

    try {
      // Firebase RTDB에 게시글 저장
      const result = await createPost(
        postCategory,
        userId,
        userName,
        postTitle,
        postContent
      );

      if (result.success) {
        // 모달 닫기 및 초기화
        setIsDialogOpen(false);
        setPostCategory("");
        setPostTitle("");
        setPostContent("");

        // 해당 카테고리 페이지로 이동
        router.push(`/forum/list?category=${postCategory}`);
      } else {
        alert(t("forum.alert.saveFailed", { error: result.error || "Unknown error" }));
      }
    } catch (error) {
      console.error("게시글 저장 오류:", error);
      alert(t("forum.alert.saveError"));
    } finally {
      // 전송 중 상태 해제
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("forum.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("forum.subtitle")}
            </p>
          </div>

          {/* 게시글 작성 버튼 */}
          <Button onClick={handleCreatePost} className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            {t("forum.writeButton")}
          </Button>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
          {FORUM_CATEGORIES.map((category) => (
            <Link
              key={category.value}
              href={`/forum/list?category=${category.value}`}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                currentCategory === category.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {category.label}
            </Link>
          ))}
        </div>

        {/* 게시글 목록 영역 */}
        {posts.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-12">
            <div className="text-center">
              <p className="text-muted-foreground text-base">
                {t("forum.empty.title")}
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {t("forum.empty.description")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.postId}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* 게시글 제목 */}
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {post.title}
                </h3>

                {/* 게시글 내용 미리보기 */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {post.content}
                </p>

                {/* 게시글 메타 정보 */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>{t("forum.post.author", { author: post.author })}</span>
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
      </div>

      {/* 글쓰기 모달 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("forum.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("forum.dialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 카테고리 선택 */}
            <div className="grid gap-2">
              <Label htmlFor="category">{t("forum.dialog.category")}</Label>
              <Select value={postCategory} onValueChange={setPostCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder={t("forum.dialog.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {FORUM_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 제목 입력 */}
            <div className="grid gap-2">
              <Label htmlFor="title">{t("forum.dialog.postTitle")}</Label>
              <Input
                id="title"
                placeholder={t("forum.dialog.titlePlaceholder")}
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
            </div>

            {/* 내용 입력 */}
            <div className="grid gap-2">
              <Label htmlFor="content">{t("forum.dialog.content")}</Label>
              <Textarea
                id="content"
                placeholder={t("forum.dialog.contentPlaceholder")}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              {t("forum.dialog.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t("forum.dialog.submitting") : t("forum.dialog.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
