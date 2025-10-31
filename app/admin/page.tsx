"use client";

// 관리자 대시보드 메인 페이지
// 개별 관리자 도구로 이동할 수 있는 링크를 제공합니다.

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto max-w-4xl px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">관리자 페이지</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            운영에 필요한 관리자 도구로 이동하세요.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              테스트 데이터 관리
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              포럼용 더미 데이터를 생성해 기능을 빠르게 검증합니다.
            </p>
            <div className="mt-4">
              <Button asChild className="w-full justify-center">
                <Link href="/admin/test-data">테스트 데이터 생성</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
