import { useState, useEffect, useRef } from 'react';
import { Calendar, History } from 'lucide-react';

// API 응답 및 상태 인터페이스
interface CollectionResponse {
  status: string;
  message: string;
  target_date: string;
  timestamp: string;
  collection_id: string;
}

interface CollectionStatus {
  status: 'started' | 'in_progress' | 'completed' | 'error';
  details: {
    progress?: number;
    message?: string;
    processed_instances?: number;
    total_queries?: number;
    total_instances?: number;
    error?: string;
    completed_at?: string;
    period?: {
      start_date: string;
      end_date: string;
    };
  };
}

interface CollectionLog {
  message: string;
  level: 'info' | 'error' | 'warning';
  timestamp: string;
}

export function CloudWatchMonitor() {
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [logs, setLogs] = useState<CollectionLog[]>([]);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // API URL 설정
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const WS_BASE_URL = API_BASE_URL.replace('http', 'ws') + '/ws/collection';

  // 로그 스크롤
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // 로그 추가 함수
  const addLog = (message: string, level: 'info' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, {
      message,
      level,
      timestamp: new Date().toISOString()
    }]);
  };

  // WebSocket 연결 함수
  const connectWebSocket = (id: string) => {
    if (!id) return;

    try {
      console.log(`Connecting to WebSocket: ${WS_BASE_URL}/${id}`);
      const ws = new WebSocket(`${WS_BASE_URL}/${id}`);

      // 연결 유지를 위한 ping 전송
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 30000);

      ws.onopen = () => {
        console.log('WebSocket connected');
        addLog('WebSocket 연결됨', 'info');
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') {
            return;
          }

          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);

          // status 직접 사용 (data.data가 아닌)
          if (data.type === 'status') {
            setStatus(data);  // data.data 대신 data 사용

            // 수집 완료 또는 에러 시 15초 후 페이지 새로고침
            if (data.status === 'completed' || data.status === 'error') {
              addLog(
                  data.status === 'completed'
                      ? '수집이 완료되었습니다. 15초 후 페이지가 새로고침됩니다.'
                      : `수집이 실패했습니다: ${data.details?.error || '알 수 없는 오류'}\n30초 후 페이지가 새로고침됩니다.`,
                  data.status === 'completed' ? 'info' : 'error'
              );

              console.log('Starting 15s refresh timer...'); // 디버깅용 로그
              setTimeout(() => {
                console.log('Refreshing page...'); // 디버깅용 로그
                window.location.reload();
              }, 30000);
            }
          } else if (data.type === 'log') {
            addLog(data.message, data.level || 'info');
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        addLog('WebSocket 연결 오류 발생', 'error');
        setError('WebSocket 연결에 실패했습니다.');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event);
        clearInterval(pingInterval);
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setError('WebSocket 연결 생성에 실패했습니다.');
    }
  };

  // 데이터 수집 시작 함수
  const handleLastMonthCollection = async () => {
    try {
      // 상태 초기화
      setLoading(true);
      setError('');
      setLogs([]);
      setStatus(null);

      const result = await fetch(API_BASE_URL, {
        method: 'POST'
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.detail || '전월 데이터 수집 중 오류가 발생했습니다.');
      }

      const data: CollectionResponse = await result.json();
      addLog(data.message, 'info');
      addLog(`수집 기간: ${data.target_date}`, 'info');

      setCollectionId(data.collection_id);
      connectWebSocket(data.collection_id);

    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      addLog(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 진행 상태 렌더링
  const renderProgress = () => {
    if (!status?.details) return null;

    const { details } = status;
    const progress = details.progress || 0;

    return (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>진행률: {progress.toFixed(1)}%</span>
            {details.processed_instances !== undefined && details.total_instances !== undefined && (
                <span>처리된 인스턴스: {details.processed_instances}/{details.total_instances}</span>
            )}
            {details.total_queries !== undefined && (
                <span>수집된 쿼리: {details.total_queries.toLocaleString()}개</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
            />
          </div>
        </div>
    );
  };

  // 로그 렌더링
  const renderLogs = () => {
    if (logs.length === 0) return null;

    return (
        <div className="mt-4 bg-gray-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">수집 로그</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto text-sm">
            {logs.map((log, index) => (
                <div
                    key={index}
                    className={`p-2 rounded ${
                        log.level === 'error' ? 'bg-red-50 text-red-700' :
                            log.level === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-white text-gray-700'
                    }`}
                >
              <span className="text-gray-500 mr-2">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
                  <span className="whitespace-pre-line">{log.message}</span>
                </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
    );
  };

  return (
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2 border-b pb-4">
          <Calendar className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">CloudWatch Slow Query Monitor</h2>
        </div>

        <div>
          <button
              onClick={handleLastMonthCollection}
              disabled={loading || status?.status === 'in_progress'}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
          >
            <History className="w-4 h-4" />
            {loading ? '수집 준비 중...' : '전월 데이터 수집'}
          </button>
        </div>

        {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
        )}

        {status && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="space-y-2">
                <p className="font-medium flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                  status.status === 'completed' ? 'bg-green-500' :
                      status.status === 'error' ? 'bg-red-500' :
                          'bg-yellow-500'
              }`}></span>
                  상태: {status.status}
                </p>
                {status.details?.period && (
                    <p className="text-gray-600">
                      수집 기간: {status.details.period.start_date} ~ {status.details.period.end_date}
                    </p>
                )}
                {status.details?.error && (
                    <p className="text-red-600">{status.details.error}</p>
                )}
                {status.details?.completed_at && (
                    <p className="text-gray-600">
                      완료 시간: {new Date(status.details.completed_at).toLocaleString()}
                    </p>
                )}
              </div>
              {renderProgress()}
            </div>
        )}

        {renderLogs()}
      </div>
  );
}