"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useRef, useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import Link from "next/link";

export default function UserAvatar() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('components.userAvatar');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userAvatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current &&
        userAvatarRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        !userAvatarRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 生成邮箱头像的函数
  const getInitials = (email: string) => {
    if (!email) return "";
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase();
  };

  // 生成随机颜色的函数 - 基于邮箱
  const getAvatarColor = (email: string) => {
    if (!email) return "#1e88e5";
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
  };

  // 处理退出登录
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push(`/${locale}/login`);
  };

  return (
    <div className="relative">
      {session?.user ? (
        <div className="flex items-center gap-2 relative">
          <div
            ref={userAvatarRef}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="cursor-pointer"
          >
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={t('avatarAlt')}
                className="w-10 h-10 rounded-full border-2 border-white shadow-md"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: getAvatarColor(session.user.email || "") }}
              >
                {getInitials(session.user.email || "")}
              </div>
            )}
          </div>

          {/* 用户菜单 */}
          {showUserMenu && (
            <div
              ref={userMenuRef}
              className="absolute right-0 top-12 w-48 bg-white rounded-md shadow-lg py-1 z-30"
            >
              {/* <Link href="/my-schemes">
                <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  {t('mySchemes')}
                </div>
              </Link> */}
              <Link href={`/${locale}/billing`} onClick={() => setShowUserMenu(false)}>
                <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  {t('billing')}
                </div>
              </Link>
              <div
                onClick={handleLogout}
                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer border-t"
              >
                {t('logout')}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link href={`/${locale}/login`}>
          <button className="py-2 px-4 bg-white rounded-md shadow-md hover:bg-gray-50 transition-colors">
            {t('login')}
          </button>
        </Link>
      )}
    </div>
  );
} 