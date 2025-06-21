"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [showLimitMessage, setShowLimitMessage] = useState(false);

  const handleGenerateClick = () => {
    // 直接导航到生成页面，验证逻辑在生成页面处理
    router.push("/generate");
  };

  const handleLoginClick = () => {
    signIn(undefined, { callbackUrl: "/" });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">AI配色方案生成器</h1>
      
      {/* 欢迎消息，根据登录状态显示不同内容 */}
      <p className="text-gray-600 mb-8">
        {session ? (
          <>欢迎，{session.user.name || session.user.email}！开始生成您的配色方案。</>
        ) : (
          <>欢迎使用AI配色方案生成器，立即体验智能配色！</>
        )}
      </p>
      
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          {/* 生成配色方案按钮 */}
          <button 
            onClick={handleGenerateClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors w-full"
          >
            开始生成配色方案
          </button>
          
          {/* 登录提示 */}
          {showLoginMessage && !session && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                请先登录才能使用此功能。
                <button 
                  onClick={handleLoginClick}
                  className="ml-2 text-blue-600 hover:underline"
                >
                  立即登录
                </button>
              </p>
            </div>
          )}
          
          {/* 使用次数限制提示 */}
          {showLimitMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                您已达到免费使用次数上限(5次)。
                <a href="#" className="ml-2 text-blue-600 hover:underline">
                  升级为会员
                </a>
                获取无限使用权限。
              </p>
            </div>
          )}
          
          {/* 显示会员状态和使用次数(仅登录用户可见) */}
          {session && !session.user.isMember && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-700">
                您目前已使用 {session.user.usageCount || 0}/5 次免费生成次数。
                <a href="#" className="ml-1 text-blue-600 hover:underline">
                  升级为会员
                </a>
                获取无限使用权限。
              </p>
            </div>
          )}
          
          {/* 管理员按钮 */}
          {session && session.user.isAdmin && (
            <div className="mt-4">
              <button 
                onClick={() => router.push("/admin/users")}
                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors"
              >
                管理用户
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
