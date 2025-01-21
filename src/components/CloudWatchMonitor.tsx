import { useState, useEffect, useRef } from 'react';
import { Calendar, History } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from './DateRangePicker';

interface Response {
  status: string;
  message: string;
  target_date: string;
  timestamp: string;
}

interface CollectionProgress {
  status: 'started' | 'collecting' | 'completed' | 'failed';
  message: string;
  progress?: string;
  total_processed?: number;
  error?: string;
  instance_id?: string;
  timestamp: string;
}

const API_BASE_URL = 'http://localhost:8000';
const POLLING_INTERVAL = 3000; // 3초

export function CloudWatchMonitor() {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [collectionStatuses, setCollectionStatuses] = useState<Record<string, CollectionProgress>>({});
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const result = await fetch(`${API_BASE_URL}/cloudwatch/status`);
      if (!result.ok) {
        return;
      }
      const data = await result.json();
      setCollectionStatuses(data);

      // 모든 작업이 completed나 failed 상태이면 폴링 중지
      const allCompleted = Object.values(data).every(
          status => status.status === 'completed' || status.status === 'failed'
      );
      if (allCompleted && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch (error) {
      console.error('Status fetch error:', error);
    }
  };

  useEffect(() => {
    fetchStatus();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(fetchStatus, POLLING_INTERVAL);
  };

  const handleDateRangeCollection = async () => {
    if (!date?.from || !date?.to) return;

    try {
      setLoading(true);
      setError('');
      const result = await fetch(`${API_BASE_URL}/cloudwatch/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: format(date.from, 'yyyy-MM-dd'),
          end_date: format(date.to, 'yyyy-MM-dd'),
        }),
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.detail || '데이터 수집 중 오류가 발생했습니다.');
      }

      const data = await result.json();
      setResponse(data);
      fetchStatus();
      startPolling();
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLastMonthCollection = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await fetch(`${API_BASE_URL}/cloudwatch/collect/last-month`, {
        method: 'POST',
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.detail || '전월 데이터 수집 중 오류가 발생했습니다.');
      }

      const data = await result.json();
      setResponse(data);
      fetchStatus();
      startPolling();
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const validateDateRange = () => {
    if (!date?.from || !date?.to) return false;
    const diffTime = Math.abs(date.to.getTime() - date.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 31;
  };

  const renderCollectionStatuses = () => {
    return Object.entries(collectionStatuses).map(([id, status]) => (
        <div key={id} className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="space-y-2">
            <p className="font-medium flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${
                status.status === 'completed' ? 'bg-green-500' :
                    status.status === 'failed' ? 'bg-red-500' :
                        'bg-yellow-500'
            }`}></span>
              상태: {status.status}
            </p>
            <p className="text-gray-600">{status.message}</p>
            {status.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>진행률: {status.progress}</span>
                    <span>{((Number(status.total_processed) || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(Number(status.total_processed) || 0) * 100}%`
                        }}
                    />
                  </div>
                </div>
            )}
            {status.instance_id && (
                <p className="text-sm text-gray-500">
                  인스턴스: {status.instance_id}
                </p>
            )}
            {status.error && (
                <p className="text-red-500">{status.error}</p>
            )}
            <p className="text-sm text-gray-500">
              업데이트: {new Date(status.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
    ));
  };

  return (
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
        {/* 헤더 */}
        <div className="flex items-center gap-2 border-b pb-4">
          <Calendar className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">CloudWatch Slow Query Monitor</h2>
        </div>

        {/* 날짜 선택 */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            수집 기간 선택
          </label>
          <DateRangePicker
              date={date}
              setDate={setDate}
              isCalendarOpen={isCalendarOpen}
              setIsCalendarOpen={setIsCalendarOpen}
          />
          {date?.from && date?.to && !validateDateRange() && (
              <p className="mt-2 text-sm text-red-500">
                날짜 범위는 최대 31일을 초과할 수 없습니다.
              </p>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
              onClick={handleDateRangeCollection}
              disabled={loading || !validateDateRange() || !date?.from || !date?.to}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {loading ? '수집 중...' : '날짜 범위 수집'}
          </button>
          <button
              onClick={handleLastMonthCollection}
              disabled={loading}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" />
            {loading ? '수집 중...' : '전월 데이터 수집'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
        )}

        {/* 수집 상태 */}
        {renderCollectionStatuses()}
      </div>
  );
}