"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthCheck } from "../auth/AuthCheck";
import { useTranslations } from 'next-intl';

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

export default function UsersPageContent() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const router = useRouter();
    const t = useTranslations('admin');

    const fetchUsers = async (page: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/users?page=${page}&limit=100`);
            if (!response.ok) {
                throw new Error(t('fetchUsersError'));
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

            if (!response.ok) throw new Error(t('updateUserError'));

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
                <h1 className="text-2xl font-bold mb-6">{t('userManagement')}</h1>

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
                                        <th className="border p-2">{t('id')}</th>
                                        <th className="border p-2">{t('name')}</th>
                                        <th className="border p-2">{t('email')}</th>
                                        <th className="border p-2">{t('registrationTime')}</th>
                                        <th className="border p-2">{t('usageCount')}</th>
                                        <th className="border p-2">{t('membershipStatus')}</th>
                                        <th className="border p-2">{t('memberExpiration')}</th>
                                        <th className="border p-2">{t('status')}</th>
                                        <th className="border p-2">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="border p-2 text-sm">{user.id.substring(0, 8)}...</td>
                                            <td className="border p-2">{user.name || t('noName')}</td>
                                            <td className="border p-2">{user.email || t('noEmail')}</td>
                                            <td className="border p-2">{formatDate(user.createdAt)}</td>
                                            <td className="border p-2">{user.usageCount}</td>
                                            <td className="border p-2">
                                                {user.isMember ? t('member') : t('nonMember')}
                                            </td>
                                            <td className="border p-2">{formatDate(user.memberExpireDate)}</td>
                                            <td className="border p-2">
                                                <span
                                                    className={`inline-block px-2 py-1 rounded-full text-xs ${user.isDisabled
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-green-100 text-green-800"
                                                        }`}
                                                >
                                                    {user.isDisabled ? t('disabled') : t('normal')}
                                                </span>
                                            </td>
                                            <td className="border p-2">
                                                {!user.isAdmin && (
                                                    <button
                                                        onClick={() => toggleUserDisabled(user.id, user.isDisabled)}
                                                        className={`px-3 py-1 rounded text-xs ${user.isDisabled
                                                            ? "bg-green-500 text-white"
                                                            : "bg-red-500 text-white"
                                                            }`}
                                                    >
                                                        {user.isDisabled ? t('enable') : t('disable')}
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
                                    className={`px-4 py-2 ${currentPage === 1
                                        ? "bg-gray-200 text-gray-500"
                                        : "bg-blue-500 text-white"
                                        } rounded`}
                                >
                                    {t('previousPage')}
                                </button>
                                <span className="px-4 py-2 bg-gray-100">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 ${currentPage === totalPages
                                        ? "bg-gray-200 text-gray-500"
                                        : "bg-blue-500 text-white"
                                        } rounded`}
                                >
                                    {t('nextPage')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthCheck>
    );
} 