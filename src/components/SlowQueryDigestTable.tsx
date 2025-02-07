import React, { useState } from 'react';
import { Database, Clock, Search, Copy, Check, X, User } from 'lucide-react';
import { format } from 'sql-formatter';
import { QueryStat } from '../types/api';

interface SlowQueryDigestTableProps {
    stats: QueryStat[];
    month: string;
}

export function SlowQueryDigestTable({ stats, month }: SlowQueryDigestTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedQuery, setSelectedQuery] = useState<QueryStat | null>(null);
    const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
    const itemsPerPage = 15;
    const totalPages = Math.ceil(stats.length / itemsPerPage);

    const paginatedStats = stats.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPages = Math.min(totalPages, 10);
        let startPage = Math.max(1, currentPage - 4);
        let endPage = Math.min(startPage + maxPages - 1, totalPages);

        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    };

    const handleCopyQuery = async (sql: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(sql);
            setCopiedQuery(sql);
            setTimeout(() => setCopiedQuery(null), 2000);
        } catch (err) {
            console.error('Failed to copy query:', err);
        }
    };

    const formatSql = (sql: string) => {
        try {
            return format(sql, {
                language: 'mysql',
                tabWidth: 2,
                keywordCase: 'upper',
            });
        } catch (err) {
            return sql;
        }
    };

    return (
        <div className="mt-8 bg-white rounded-lg shadow w-full">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Slow Query Digest ({month})
                    </h3>
                </div>

                <div className="overflow-x-auto max-h-[800px]">
                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                        <colgroup>
                            <col className="w-[180px]" />
                            <col className="w-[140px]" />
                            <col className="w-[100px]" />
                            <col className="w-[120px]" />
                            <col className="w-[100px]" />
                            <col className="w-[140px]" />
                            <col />
                        </colgroup>
                        <thead className="sticky top-0 bg-white">
                        <tr>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instance</th>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exec Count</th>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time (s)</th>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time (s)</th>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Rows Examined</th>
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SQL Digest</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedStats.map((stat, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <span className="flex items-center">
                                        <Database className="w-4 h-4 mr-1 flex-shrink-0" />
                                        {stat.instance_id}
                                    </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <span className="flex items-center">
                                        <User className="w-4 h-4 mr-1 flex-shrink-0" />
                                        {stat.user || '-'}
                                    </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {stat.sum_stats.execution_count.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <span className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {stat.sum_stats.total_time.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {stat.avg_stats.avg_time.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    {stat.avg_stats.avg_rows_examined.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-sm relative w-[500px] max-w-[500px] overflow-hidden">
                                    <div
                                        className="truncate w-full cursor-pointer"
                                        onClick={() => setSelectedQuery(selectedQuery?.digest_query === stat.digest_query ? null : stat)}
                                    >
                                        {stat.digest_query}
                                    </div>
                                    {selectedQuery?.digest_query === stat.digest_query && (
                                        <div className="fixed right-4 top-20 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[600px] max-w-3xl z-[9999] max-h-[calc(100vh-160px)] flex flex-col">
                                            <div className="p-4 border-b border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        SQL Query
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleCopyQuery(stat.digest_query, e)}
                                                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                                            title="Copy SQL"
                                                        >
                                                            {copiedQuery === stat.digest_query ? (
                                                                <Check className="w-4 h-4 text-green-500"/>
                                                            ) : (
                                                                <Copy className="w-4 h-4 text-gray-500"/>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedQuery(null);
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                            title="Close"
                                                        >
                                                            <X className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 overflow-y-auto">
                                                <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                                                    {formatSql(stat.digest_query)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6">
                    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
                        <div className="flex w-0 flex-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                            >
                                {'<<'}
                            </button>
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                            >
                                {'<'}
                            </button>
                        </div>
                        <div className="hidden md:flex">
                            {getPageNumbers().map((number) => (
                                <button
                                    key={number}
                                    onClick={() => setCurrentPage(number)}
                                    className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                                        currentPage === number
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    {number}
                                </button>
                            ))}
                        </div>
                        <div className="flex w-0 flex-1 justify-end">
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                            >
                                {'>'}
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                            >
                                {'>>'}
                            </button>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    );
}