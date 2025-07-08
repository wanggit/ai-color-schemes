"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { FaGoogle, FaEnvelope, FaLock } from "react-icons/fa6";
import { useSafeTranslations } from '@/hooks/useSafeTranslations';

export default function LoginPage() {
  const t = useSafeTranslations('pages.login');

  const [selectedProvider, setSelectedProvider] = useState<string>("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 根据NODE_ENV环境变量判断是否为开发环境
  // 只有在开发环境中才显示邮箱密码登录
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleSignIn = (provider: string) => {
    setSelectedProvider(provider);
    setLoading(true);
    signIn(provider, { callbackUrl: "/" });
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t('emailRequired'));
      return;
    }

    try {
      setLoading(true);
      const result = await signIn("credentials", {
        redirect: true,
        email,
        password: password || "anything", // 开发环境下密码可以是任意值
        callbackUrl: "/",
      });

      // 如果有错误但没有重定向
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError(t('loginFailed'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="flex flex-col items-center mb-8">
          {/* 使用新的AI Color Schemes logo */}
          <div className="mb-6 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg">
            <Image
              src="/logo-with-text.svg"
              alt="AI Color Schemes"
              width={200}
              height={150}
              className="w-auto h-20 object-contain"
              priority
            />
          </div>
          <p className="text-gray-600 text-center text-sm">{t('instructions')}</p>
        </div>

        {/* 开发环境下显示邮箱登录 */}
        {isDevelopment && (
          <form onSubmit={handleCredentialsSignIn} className="mb-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-3 border transition-colors"
                  placeholder={t('emailPlaceholder')}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{t('devPassword')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-3 border transition-colors"
                  placeholder={t('passwordPlaceholder')}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-3 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-lg font-medium"
            >
              {loading ? t('loggingIn') : t('emailLogin')}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">{t('orSocialLogin')}</span>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <button
            onClick={() => handleSignIn("google")}
            disabled={loading}
            className={`flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200 shadow-md font-medium ${selectedProvider === "google"
              ? "bg-red-600 text-white shadow-lg"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaGoogle className="mr-2" />
            {t('googleLogin')}
          </button>

          {/* Facebook和X登录已隐藏 */}
          {/*
          <button
            onClick={() => handleSignIn("facebook")}
            disabled={loading}
            className={`flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200 shadow-md font-medium ${selectedProvider === "facebook"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaFacebook className="mr-2" />
            {t('facebookLogin')}
          </button>

          <button
            onClick={() => handleSignIn("twitter")}
            disabled={loading}
            className={`flex items-center justify-center w-full p-3 rounded-lg transition-all duration-200 shadow-md font-medium ${selectedProvider === "twitter"
              ? "bg-blue-400 text-white shadow-lg"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaXTwitter className="mr-2" />
            {t('twitterLogin')}
          </button>
          */}
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center">
          {t('terms')}
        </p>
      </div>
    </div>
  );
} 