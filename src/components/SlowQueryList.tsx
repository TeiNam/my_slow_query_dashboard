import { useEffect, useState } from 'react';
import { Calendar, Clock, Database, User, Server, Copy, Check, Globe, Filter, Hash, X, RefreshCw } from 'lucide-react';
import { format } from 'sql-formatter';
import { SlowQuery } from '../types/api';

interface QueryListResponse {
  total: number;
  page: number;
  page_size: number;
  items: SlowQuery[];
}

interface SlowQueryListProps {
  onPidSelect: (pid: string) => void;
  onRefresh?: () => void; // 부모 컴포넌트에 새로고침 상태를 알리는 콜백
  autoRefresh?: boolean; // 자동 새로고침 활성화 여부
  isRefreshing?: boolean; // 현재 새로고침 진행 여부
}

export function SlowQueryList({ onPidSelect, onRefresh, autoRefresh = true, isRefreshing = false }: SlowQueryListProps) {
  const [queries, setQueries] = useState<QueryListResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<SlowQuery | null>(null);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<'UTC' | 'KST'>('KST');
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [instances, setInstances] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      let url = `${baseUrl}/mysql/queries?page=${currentPage}&page_size=20`;

      if (selectedInstance) {
        url += `&instance=${selectedInstance}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch queries');
      const data = await response.json();
      
      // 이전 쿼리와 새로운 쿼리를 비교하여 변경 여부 확인
      const hasNewData = JSON.stringify(data.items) !== JSON.stringify(queries?.items);
      
      setQueries(data);

      if (data.items && !selectedInstance) {
        const uniqueInstances = Array.from(new Set(data.items.map((item: SlowQuery) => item.instance))).sort();
        setInstances(uniqueInstances as string[]);
      }

      setError(null);
      
      // 부모 컴포넌트에 새로고침 완료 알림
      if (onRefresh) {
        onRefresh();
      }
      
      // 로그 메시지로 새로고침 여부 표시
      if (hasNewData) {
        console.log('✅ 데이터가 새로고침되었습니다:', new Date().toLocaleTimeString());
      } else {
        console.log('ℹ️ 새로고침 완료 - 변경사항 없음:', new Date().toLocaleTimeString());
      }
    } catch (err) {
      setError('Failed to fetch slow queries');
      console.error('Error fetching queries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [currentPage, selectedInstance]);
  
  // autoRefresh prop이 변경되었을 때 반응
  useEffect(() => {
    if (autoRefresh) {
      fetchQueries();
    }
  }, [autoRefresh]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (timezone === 'KST') {
      return new Date(date.getTime() + 9 * 60 * 60 * 1000).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul'
      });
    }
    return date.toLocaleString('en-US', { timeZone: 'UTC' });
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
          <button 
            onClick={fetchQueries}
            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium bg-red-600 text-white hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            다시 시도
          </button>
        </div>
    );
  }

  return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Slow Queries
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                    value={selectedInstance}
                    onChange={(e) => setSelectedInstance(e.target.value)}
                    className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Instances</option>
                  {instances.map((instance) => (
                      <option key={instance} value={instance}>{instance}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value as 'UTC' | 'KST')}
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="KST">KST</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              
              <button
                onClick={fetchQueries}
                disabled={refreshing || isRefreshing}
                className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                title="수동 새로고침"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing || isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading && !queries ? (
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
                  <tbody className={`bg-white divide-y divide-gray-200 ${refreshing || isRefreshing ? 'opacity-50' : ''}`}>
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
                            <Calendar className="w-4 h-4 mr-1 flex-shrink-0"/>
                            {formatDate(query.start)}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm">
                          <span className="flex items-center">
                            <Database className="w-4 h-4 mr-1 flex-shrink-0"/>
                            {query.instance}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm">
                          <span className="flex items-center">
                            <Server className="w-4 h-4 mr-1 flex-shrink-0"/>
                            {query.db}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm">
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1 flex-shrink-0"/>
                            {query.user}@{query.host}
                          </span>
                        </td>
                        <td
                            className="px-2 py-2 whitespace-nowrap text-sm cursor-pointer hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPidSelect(query.pid.toString());
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
                            {Math.round(query.time)}s
                          </span>
                        </td>
                        <td className="px-2 py-2 text-sm relative w-[500px] max-w-[500px] overflow-hidden">
                          <div className="truncate w-full">
                            {query.sql_text}
                          </div>
                          {selectedQuery?.pid === query.pid && (
                              <div className="fixed right-4 top-20 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[600px] max-w-3xl z-[9999] max-h-[calc(100vh-160px)] flex flex-col">
                                <div className="p-4 border-b border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      SQL Query (PID: {query.pid})
                                    </span>
                                    <div className="flex items-center gap-2">
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
                                    {formatSql(query.sql_text)}
                                  </pre>
                                </div>
                              </div>
                          )}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>

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