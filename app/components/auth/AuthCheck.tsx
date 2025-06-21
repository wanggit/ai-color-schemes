"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthCheck({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (adminOnly && !session.user.isAdmin) {
      router.push("/");
      return;
    }
  }, [session, status, router, adminOnly]);

  // 如果正在加载或未登录，显示加载状态
  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果需要管理员权限但用户不是管理员
  if (adminOnly && !session.user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">无权访问</h1>
        <p className="mt-2 text-gray-600">您没有访问此页面的权限</p>
      </div>
    );
  }

  return <>{children}</>;
} 