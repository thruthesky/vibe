"use client";

// 게시판 목록 페이지
// 게시글 목록을 표시하고, 새 게시글을 작성할 수 있는 페이지입니다.
// 현재는 게시글이 없으므로 "게시글이 없습니다" 메시지를 표시합니다.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
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
import { MessageSquarePlus } from "lucide-react";

export default function ForumListPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 글쓰기 모달 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");

  // Firebase 인증 상태 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
      }
      // 인증 상태 확인 완료
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 인증 상태 확인 중일 때 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
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
    setPostTitle("");
    setPostContent("");
  };

  // 글쓰기 전송 핸들러
  const handleSubmit = () => {
    if (!postTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!postContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    // TODO: Firebase RTDB에 게시글 저장
    alert(`제목: ${postTitle}\n내용: ${postContent}\n\n게시글 저장 기능은 곧 구현됩니다.`);

    // 모달 닫기 및 초기화
    setIsDialogOpen(false);
    setPostTitle("");
    setPostContent("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">포럼</h1>
            <p className="text-sm text-muted-foreground mt-1">
              자유롭게 의견을 나누는 공간입니다
            </p>
          </div>

          {/* 게시글 작성 버튼 */}
          <Button onClick={handleCreatePost} className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            글쓰기
          </Button>
        </div>

        {/* 게시글 목록 영역 */}
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
      </div>

      {/* 글쓰기 모달 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>새 게시글 작성</DialogTitle>
            <DialogDescription>
              게시글의 제목과 내용을 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 제목 입력 */}
            <div className="grid gap-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="제목을 입력하세요"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* 내용 입력 */}
            <div className="grid gap-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                placeholder="내용을 입력하세요"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button onClick={handleSubmit}>전송</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
