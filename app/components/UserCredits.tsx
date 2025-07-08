"use client";

import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const CreditsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>

);

export default function UserCredits() {
    const { data: session } = useSession();

    const { data, error } = useSWR(
        session ? '/api/user/credits' : null,
        fetcher,
        {
            refreshInterval: 5000, // Refresh every 5 seconds
        }
    );

    if (!session) {
        return null;
    }

    if (error) {
        return <div className="flex items-center space-x-1 text-sm text-red-500" title="Failed to load credits">
            <CreditsIcon />
            <span>-</span>
        </div>;
    }

    if (!data) {
        return (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
                <CreditsIcon />
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-1 text-sm">
            <CreditsIcon className="text-gray-600" />
            <span className="font-bold text-gray-900 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                {data.credits}
            </span>
        </div>
    );
} 