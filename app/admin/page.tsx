"use client";

// 관리자 대시보드 메인 페이지
// 개별 관리자 도구로 이동할 수 있는 링크를 제공합니다.

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto max-w-4xl px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("admin.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("admin.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("admin.testData.title")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("admin.testData.description")}
            </p>
            <div className="mt-4">
              <Button asChild className="w-full justify-center">
                <Link href="/admin/test-data">{t("admin.testData.button")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
