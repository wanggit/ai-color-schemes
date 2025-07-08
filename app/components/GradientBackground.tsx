import React from "react";

export default function GradientBackground() {
  return (
    <>
      {/* 酷炫渐变背景 */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-10"></div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,#5b60c270_0%,transparent_40%)]"></div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_60%_70%,#e71e5870_0%,transparent_30%)]"></div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_90%_10%,#3f9cf870_0%,transparent_35%)]"></div>
      <div className="fixed inset-0 -z-10 backdrop-blur-[80px]"></div>
    </>
  );
} 