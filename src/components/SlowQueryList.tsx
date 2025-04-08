import { useEffect, useState, useRef } from 'react';
import { Calendar, Clock, Database, User, Server, Copy, Check, Globe, Filter, Hash, X, RefreshCw, Pause } from 'lucide-react';
import { format } from 'sql-formatter';
import { SlowQuery } from '../types/api';

// 새로고침 간격 옵션 (초 단위)
const REFRESH_INTERVALS = [
  { label: '5초', value: 5 },
  { label: '15초', value: 15 },
  { label: '30초', value: 30 },
  { label: '1분', value: 60 },
  { label: '5분', value: 300 },
  { label: '10분', value: 600 },
  { label: '30분', value: 1800 },
  { label: '1시간', value: 3600 }
];

interface QueryListResponse {
  total: number;
  page: number;
  page_size: number;
  items: SlowQuery[];
}

interface SlowQueryListProps {
  onPidSelect: (pid: string) => void;
  onRefreshComplete?: () => void; // 새로고침 완료 콜백
  lastRefreshed: Date;
}

export const SlowQueryList = ({ onPidSelect, onRefreshComplete, lastRefreshed }: SlowQueryListProps) => {
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

  // 새로고침 관련 상태 및 타이머 추가
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // 기본값 30초
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(30);
  const refreshTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // 쿼리 데이터 가져오기 함수
  const fetchQueries = async () => {
    try {
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
      if (onRefreshComplete) {
        onRefreshComplete();
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

  // 카운트다운 타이머 설정 및 정리 함수
  const setupCountdownTimer = () => {
    clearCountdownTimer();

    if (isAutoRefreshEnabled) {
      setNextRefreshIn(refreshInterval);
      countdownTimerRef.current = window.setInterval(() => {
        setNextRefreshIn(prev => {
          const newValue = Math.max(0, prev - 1);
          if (newValue === 0) {
            fetchQueries(); // 카운트다운이 0에 도달하면 새로고침
            return refreshInterval; // 카운트다운 리셋
          }
          return newValue;
        });
      }, 1000);
    }
  };

  const clearCountdownTimer = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  // 자동 새로고침 설정
  useEffect(() => {
    // 이전 타이머 정리
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // 자동 새로고침이 활성화된 경우에만 타이머 설정
    if (isAutoRefreshEnabled) {
      // 초기 데이터 로드
      fetchQueries();

      // 카운트다운 타이머 설정
      setupCountdownTimer();
    }

    return () => {
      clearCountdownTimer();
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval]);

  // 페이지 또는 인스턴스 선택이 변경되었을 때 데이터 다시 가져오기
  useEffect(() => {
    fetchQueries();
  }, [currentPage, selectedInstance]);

  // 자동 새로고침 toggle
  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(prev => !prev);
  };

  // 새로고침 간격 변경 핸들러
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = parseInt(e.target.value, 10);
    setRefreshInterval(newInterval);
    setNextRefreshIn(newInterval);

    // 카운트다운 타이머 재설정
    setupCountdownTimer();
  };

  // 수동 새로고침 핸들러
  const handleManualRefresh = () => {
    fetchQueries();
  };

  // 시간 형식 포맷팅 (HH:MM:SS)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (timezone === 'KST') {
      return new Date(date.getTime() + 9 * 60 * 60 * 1000).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul'
      });
    }
    return date.toLocaleString('en-US', { timeZone: 'UTC' });
  };

  // SQL 쿼리 포맷팅 함수
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

  // 쿼리 복사 핸들러
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

  // 페이지네이션 관련 함수들
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

  // 에러 상태 표시
  if (error) {
    return (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
              onClick={fetchQueries}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              aria-label="다시 시도"
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
              {/* 인스턴스 필터 */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                    value={selectedInstance}
                    onChange={(e) => setSelectedInstance(e.target.value)}
                    className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    aria-label="인스턴스 선택"
                >
                  <option value="">All Instances</option>
                  {instances.map((instance) => (
                      <option key={instance} value={instance}>{instance}</option>
                  ))}
                </select>
              </div>

              {/* 시간대 선택 */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value as 'UTC' | 'KST')}
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    aria-label="시간대 선택"
                >
                  <option value="KST">KST</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              {/* 새로고침 컨트롤 - 이제 여기로 이동 */}
              <div className="flex items-center gap-2">
                {/* 새로고침 상태 표시 */}
                <div className={`text-sm ${refreshing ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {refreshing ? (
                      <span className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    새로고침 중...
                  </span>
                  ) : (
                      <>마지막: {formatTime(lastRefreshed)}</>
                  )}
                </div>

                {/* 새로고침 간격 선택 */}
                <select
                    value={refreshInterval}
                    onChange={handleIntervalChange}
                    disabled={!isAutoRefreshEnabled}
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:opacity-50"
                    aria-label="새로고침 간격 선택"
                >
                  {REFRESH_INTERVALS.map((interval) => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                  ))}
                </select>

                {/* 자동 새로고침 토글 버튼 */}
                <button
                    onClick={toggleAutoRefresh}
                    className={`inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                        isAutoRefreshEnabled
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={isAutoRefreshEnabled ? '자동 새로고침 중지' : '자동 새로고침 시작'}
                    aria-label={isAutoRefreshEnabled ? '자동 새로고침 중지' : '자동 새로고침 시작'}
                >
                  {isAutoRefreshEnabled ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        <span>{nextRefreshIn}초</span>
                      </>
                  ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                      </>
                  )}
                </button>

                {/* 수동 새로고침 버튼 */}
                <button
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    title="수동 새로고침"
                    aria-label="수동 새로고침"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
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
                  <tbody className={`bg-white divide-y divide-gray-200 ${refreshing ? 'opacity-50' : ''}`}>
                  {queries?.items.map((query) => (
                      /* 이하 기존 코드와 동일 */
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
                                          aria-label="SQL 복사"
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
                                          aria-label="닫기"
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
                  <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0" aria-label="페이지네이션">
                    <div className="flex w-0 flex-1">
                      <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                          aria-label="첫 페이지"
                      >
                        {'<<'}
                      </button>
                      <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                          aria-label="이전 페이지"
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
                              aria-label={`페이지 ${number}`}
                              aria-current={currentPage === number ? 'page' : undefined}
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
                          aria-label="다음 페이지"
                      >
                        {'>'}
                      </button>
                      <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                          aria-label="마지막 페이지"
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
};
