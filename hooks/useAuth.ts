import { useSession, signIn } from "next-auth/react";
import { useState } from "react";

type AuthCheckResult = {
  success: boolean;
  message?: string;
};

export function useAuth() {
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // 验证用户是否登录及使用次数是否超限
  const checkAuth = async (): Promise<AuthCheckResult> => {
    // 检查是否登录
    if (!session) {
      // 触发登录
      signIn(undefined, { callbackUrl: "/generate" });
      return { success: false, message: "请先登录" };
    }

    // 检查是否被禁用
    if (session.user.isDisabled) {
      return { success: false, message: "您的账号已被禁用，请联系管理员" };
    }

    // 如果是会员，直接通过
    if (session.user.isMember) {
      // 检查会员是否过期
      const memberExpireDate = session.user.memberExpireDate
        ? new Date(session.user.memberExpireDate)
        : null;
      
      if (memberExpireDate && memberExpireDate > new Date()) {
        return { success: true };
      }
    }

    // 检查非会员使用次数
    if (session.user.usageCount >= 5) {
      setShowLimitModal(true);
      return { success: false, message: "已达到免费使用次数上限" };
    }

    return { success: true };
  };

  // 验证用户是否为管理员
  const checkAdmin = (): boolean => {
    return !!session?.user.isAdmin;
  };

  // 关闭登录提示
  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  // 关闭次数限制提示
  const closeLimitModal = () => {
    setShowLimitModal(false);
  };

  // 升级为会员
  const upgradeMembership = () => {
    // 导航到会员支付页面
    window.location.href = "/payment";
  };

  return {
    session,
    checkAuth,
    checkAdmin,
    showLoginModal,
    showLimitModal,
    closeLoginModal,
    closeLimitModal,
    upgradeMembership,
  };
} 