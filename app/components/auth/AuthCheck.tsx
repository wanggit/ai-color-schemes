"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from 'next-intl';

export function AuthCheck({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const sessionData = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('components.auth');

  useEffect(() => {
    if (sessionData.status === "loading") return;

    if (!sessionData.data) {
      router.push(`/${locale}/login`);
      return;
    }

    if (adminOnly && !sessionData.data.user.isAdmin) {
      router.push(`/${locale}`);
      return;
    }
  }, [sessionData, router, adminOnly, locale]);

  // 如果正在加载或未登录，显示加载状态
  if (sessionData.status === "loading" || !sessionData.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果需要管理员权限但用户不是管理员
  if (adminOnly && !sessionData.data.user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">{t('accessDenied')}</h1>
        <p className="mt-2 text-gray-600">{t('noPermission')}</p>
      </div>
    );
  }

  return <>{children}</>;
} 