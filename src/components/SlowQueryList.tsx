import React, { useState, useEffect } from 'react';
import { Clock, Database, User, Server, Copy, Check, Calendar, Hash } from 'lucide-react';
import { format } from 'sql-formatter';
import { SlowQuery } from '../types/api';

interface QueryListResponse {
  total: number;
  page: number;
  page_size: number;
  items: SlowQuery[];
}

export function SlowQueryList() {
  const [queries, setQueries] = useState<QueryListResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<SlowQuery | null>(null);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const fetchQueries = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/mysql/queries?page=${page}&page_size=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch queries');
      }
      const data = await response.json();
      setQueries(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch slow queries');
      console.error('Error fetching queries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries(currentPage);
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  const totalPages = queries ? Math.ceil(queries.total / queries.page_size) : 0;

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

  if (error) {
    return (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
    );
  }

  return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Slow Queries
          </h3>

          {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
          ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                  <tr>
                    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Start Time</th>
                    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Instance</th>
                    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Database</th>
                    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">User</th>
                    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">PID</th>
                    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Time</th>
                    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">Query</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {queries?.items.map((query) => (
                      <tr
                          key={`${query.pid}-${query.start}`}
                          className="hover:bg-gray-50 cursor-pointer relative group"
                          onClick={() => {
                            if (selectedQuery?.pid === query.pid) {
                              setSelectedQuery(null);
                            } else {
                              setSelectedQuery(query);
                            }
                          }}
                      >
                        <td className="px-2 py-2 whitespace-nowrap text-sm">
                     <span className="flex items-center">
                       <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                       {formatDate(query.start)}
                     </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm">
                     <span className="flex items-center">
                       <Database className="w-4 h-4 mr-1 flex-shrink-0" />
                       {query.instance}
                     </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm">
                     <span className="flex items-center">
                       <Server className="w-4 h-4 mr-1 flex-shrink-0" />
                       {query.db}
                     </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm">
                     <span className="flex items-center">
                       <User className="w-4 h-4 mr-1 flex-shrink-0" />
                       {query.user}@{query.host}
                     </span>
                        </td>
                        <td
                            className="px-2 py-2 whitespace-nowrap text-sm cursor-pointer hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();  // 로우 클릭 이벤트 전파 방지
                              // Assuming 'onPidSelect' is not defined, we'll comment it out
                              // onPidSelect(query.pid.toString());
                            }}
                        >
                          <span className="flex items-center">
                            <Hash className="w-4 h-4 mr-1 flex-shrink-0"/>
                            {query.pid}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm">
                     <span className="flex items-center">
                       <Clock className="w-4 h-4 mr-1 flex-shrink-0"/>
                       {query.time.toFixed(2)}s
                     </span>
                        </td>
                        <td className="px-2 py-2 text-sm relative w-[500px] max-w-[500px] overflow-hidden">
                          <div className="truncate w-full">
                            {query.sql_text}
                          </div>
                          {selectedQuery?.pid === query.pid && (
                              <div
                                  className="fixed right-4 top-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[600px] max-w-3xl z-[9999]">
                                <div className="flex justify-between items-start mb-2">
                                  <span
                                      className="text-sm font-medium text-gray-700">SQL Query (PID: {query.pid})</span>
                                  <button
                                      onClick={(e) => handleCopyQuery(query.sql_text, e)}
                                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                      title="Copy SQL"
                                  >
                                    {copiedQuery === query.sql_text ? (
                                        <Check className="w-4 h-4 text-green-500"/>
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-500"/>
                                    )}
                                  </button>
                                </div>
                                <pre
                                    className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md overflow-x-auto">
                           {formatSql(query.sql_text)}
                         </pre>
                              </div>
                          )}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>

                {/* Pagination */}
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
          )}
        </div>
      </div>
  );
}