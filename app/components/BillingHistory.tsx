'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

interface Payment {
    id: string;
    amount: number;
    currency: string;
    provider: string;
    providerPaymentId: string;
    status: string;
    purchaseType: string;
    membershipType: string | null;
    creditsPurchased: number | null;
    createdAt: string;
}

const BillingHistory = () => {
    const params = useParams()
    const locale = params.locale as string
    const t = useTranslations('components.billing')
    const [payments, setPayments] = useState<Payment[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [credits, setCredits] = useState<number | null>(null)

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/payments/history?page=${currentPage}&limit=50`)
                if (response.ok) {
                    const data = await response.json()
                    setPayments(data.payments)
                    setTotalPages(data.totalPages)
                } else {
                    console.error('Failed to fetch payment history')
                    setPayments([])
                    setTotalPages(1)
                }
            } catch (error) {
                console.error('Error fetching payment history:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPayments()
    }, [currentPage])

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const response = await fetch('/api/user/credits')
                if (response.ok) {
                    const data = await response.json()
                    setCredits(data.credits)
                } else {
                    console.error('Failed to fetch user credits')
                }
            } catch (error) {
                console.error('Error fetching user credits:', error)
            }
        }

        fetchCredits()
    }, [])

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    {credits !== null && (
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            {t('remainingCredits', { credits })}
                        </p>
                    )}
                </div>
                <Link href={`/${locale}/pricing`} passHref>
                    <button className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold transition-colors">
                        {t('upgradeMember')}
                    </button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10">{t('loading')}</div>
            ) : payments.length === 0 ? (
                <div className="text-center py-10">{t('noRecords')}</div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="py-3 px-6">{t('amount')}</th>
                                    <th scope="col" className="py-3 px-6">{t('currency')}</th>
                                    <th scope="col" className="py-3 px-6">{t('provider')}</th>
                                    <th scope="col" className="py-3 px-6">{t('status')}</th>
                                    <th scope="col" className="py-3 px-6">{t('purchaseType')}</th>
                                    <th scope="col" className="py-3 px-6">{t('membershipType')}</th>
                                    <th scope="col" className="py-3 px-6">{t('creditsPurchased')}</th>
                                    <th scope="col" className="py-3 px-6">{t('createdAt')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="py-4 px-6">{payment.amount}</td>
                                        <td className="py-4 px-6">{payment.currency}</td>
                                        <td className="py-4 px-6">{payment.provider}</td>
                                        <td className="py-4 px-6">{payment.status}</td>
                                        <td className="py-4 px-6">{payment.purchaseType}</td>
                                        <td className="py-4 px-6">{payment.membershipType || 'N/A'}</td>
                                        <td className="py-4 px-6">{payment.creditsPurchased || 'N/A'}</td>
                                        <td className="py-4 px-6">{new Date(payment.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                        <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50">
                            {t('previous')}
                        </button>
                        <span>
                            {t('pageInfo', { current: currentPage, total: totalPages })}
                        </span>
                        <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50">
                            {t('next')}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default BillingHistory 