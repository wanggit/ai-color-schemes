"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthCheck } from "../../components/auth/AuthCheck";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  usageCount: number;
  isMember: boolean;
  memberExpireDate: string | null;
  isDisabled: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { data: session } = useSession();
  const router = useRouter();

  const fetchUsers = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=100`);
      if (!response.ok) {
        throw new Error("获取用户列表失败");
      }
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(Math.ceil(data.total / 100));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserDisabled = async (userId: string, isDisabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDisabled: !isDisabled }),
      });

      if (!response.ok) throw new Error("更新用户状态失败");

      // 更新本地状态
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isDisabled: !isDisabled } : user
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // 格式化日期显示
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("zh-CN");
  };

  return (
    <AuthCheck adminOnly>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">用户管理</h1>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">ID</th>
                    <th className="border p-2">名称</th>
                    <th className="border p-2">邮箱</th>
                    <th className="border p-2">注册时间</th>
                    <th className="border p-2">使用次数</th>
                    <th className="border p-2">会员状态</th>
                    <th className="border p-2">会员过期时间</th>
                    <th className="border p-2">状态</th>
                    <th className="border p-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="border p-2 text-sm">{user.id.substring(0, 8)}...</td>
                      <td className="border p-2">{user.name || "无名称"}</td>
                      <td className="border p-2">{user.email || "无邮箱"}</td>
                      <td className="border p-2">{formatDate(user.createdAt)}</td>
                      <td className="border p-2">{user.usageCount}</td>
                      <td className="border p-2">
                        {user.isMember ? "会员" : "非会员"}
                      </td>
                      <td className="border p-2">{formatDate(user.memberExpireDate)}</td>
                      <td className="border p-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            user.isDisabled
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.isDisabled ? "已禁用" : "正常"}
                        </span>
                      </td>
                      <td className="border p-2">
                        {!user.isAdmin && (
                          <button
                            onClick={() => toggleUserDisabled(user.id, user.isDisabled)}
                            className={`px-3 py-1 rounded text-xs ${
                              user.isDisabled
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {user.isDisabled ? "启用" : "禁用"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-500 text-white"
                  } rounded`}
                >
                  上一页
                </button>
                <span className="px-4 py-2 bg-gray-100">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-500 text-white"
                  } rounded`}
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AuthCheck>
  );
} 