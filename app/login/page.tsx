"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { FaGoogle, FaFacebook, FaXTwitter } from "react-icons/fa6";

export default function LoginPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>("google");

  const handleSignIn = (provider: string) => {
    setSelectedProvider(provider);
    signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/favicon.ico"
            alt="AI Color Schemes"
            width={64}
            height={64}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-center">AI Color Schemes</h1>
          <p className="text-gray-600 text-center mt-2">登录以使用AI配色方案生成器</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSignIn("google")}
            className={`flex items-center justify-center w-full p-3 rounded-md transition-all ${
              selectedProvider === "google"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaGoogle className="mr-2" />
            使用Google登录
          </button>

          <button
            onClick={() => handleSignIn("facebook")}
            className={`flex items-center justify-center w-full p-3 rounded-md transition-all ${
              selectedProvider === "facebook"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaFacebook className="mr-2" />
            使用Facebook登录
          </button>

          <button
            onClick={() => handleSignIn("twitter")}
            className={`flex items-center justify-center w-full p-3 rounded-md transition-all ${
              selectedProvider === "twitter"
                ? "bg-blue-400 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaXTwitter className="mr-2" />
            使用X登录
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
} 