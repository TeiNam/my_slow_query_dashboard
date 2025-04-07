import { useState, useEffect, useRef } from 'react';
import { QueryExplain } from '../components/QueryExplain';
import { SlowQueryList } from '../components/SlowQueryList';
import { RefreshCw, Pause } from 'lucide-react';

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

export function MySQLMonitorPage() {
    const [selectedPid, setSelectedPid] = useState<string>('');
    const [refreshInterval, setRefreshInterval] = useState<number>(30); // 기본값 30초
    const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [nextRefreshIn, setNextRefreshIn] = useState<number>(30);
    const refreshTimerRef = useRef<number | null>(null);
    const countdownTimerRef = useRef<number | null>(null);

    // 슬로우 쿼리 목록 새로고침 핸들러 (SlowQueryList 컴포넌트로 전달)
    const handleRefresh = () => {
        setLastRefreshed(new Date());
        setNextRefreshIn(refreshInterval);
    };

    // 자동 새로고침 toggle
    const toggleAutoRefresh = () => {
        setIsAutoRefreshEnabled((prev) => !prev);
    };

    // 새로고침 간격 변경 핸들러
    const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newInterval = parseInt(e.target.value, 10);
        setRefreshInterval(newInterval);
        setNextRefreshIn(newInterval);
        
        // 타이머 재설정
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
        
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        
        if (isAutoRefreshEnabled) {
            // 새로고침 타이머 설정
            refreshTimerRef.current = window.setInterval(() => {
                handleRefresh();
            }, newInterval * 1000);
            
            // 카운트다운 타이머 설정
            countdownTimerRef.current = window.setInterval(() => {
                setNextRefreshIn((prev) => Math.max(0, prev - 1));
            }, 1000);
        }
    };

    // 수동 새로고침 핸들러
    const handleManualRefresh = () => {
        handleRefresh();
        
        // 타이머 재설정
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
        }
        
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
        }
        
        if (isAutoRefreshEnabled) {
            // 새로고침 타이머 설정
            refreshTimerRef.current = window.setInterval(() => {
                handleRefresh();
            }, refreshInterval * 1000);
            
            // 카운트다운 타이머 설정
            countdownTimerRef.current = window.setInterval(() => {
                setNextRefreshIn((prev) => Math.max(0, prev - 1));
            }, 1000);
        }
    };

    // 자동 새로고침 effect
    useEffect(() => {
        if (isAutoRefreshEnabled) {
            // 초기 새로고침
            handleRefresh();
            
            // 새로고침 타이머 설정
            refreshTimerRef.current = window.setInterval(() => {
                handleRefresh();
            }, refreshInterval * 1000);
            
            // 카운트다운 타이머 설정
            countdownTimerRef.current = window.setInterval(() => {
                setNextRefreshIn((prev) => Math.max(0, prev - 1));
            }, 1000);
        } else {
            // 타이머 제거
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
            
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
            }
        }
        
        // 컴포넌트 언마운트 시 타이머 제거
        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
        };
    }, [isAutoRefreshEnabled, refreshInterval]);

    // 시간 형식 포맷팅 (HH:MM:SS)
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="space-y-6 px-4 sm:px-6 md:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        MySQL Real-time Slow Query Monitor
                    </h2>
                    <h4 className="text-base italic leading-7 text-gray-500 ml-4 sm:truncate sm:text-base sm:tracking-tight">
                        = AWS Aurora for MySQL & RDS =
                    </h4>
                </div>
                
                {/* 자동 새로고침 컨트롤 */}
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <div className="text-sm text-gray-500">
                        마지막 새로고침: {formatTime(lastRefreshed)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <select
                            value={refreshInterval}
                            onChange={handleIntervalChange}
                            disabled={!isAutoRefreshEnabled}
                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:opacity-50"
                        >
                            {REFRESH_INTERVALS.map((interval) => (
                                <option key={interval.value} value={interval.value}>
                                    {interval.label}
                                </option>
                            ))}
                        </select>
                        
                        <button
                            onClick={toggleAutoRefresh}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                                isAutoRefreshEnabled
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={isAutoRefreshEnabled ? '자동 새로고침 중지' : '자동 새로고침 시작'}
                        >
                            {isAutoRefreshEnabled ? (
                                <>
                                    <Pause className="w-4 h-4 mr-1" />
                                    <span>{nextRefreshIn}초</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    <span>중지됨</span>
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={handleManualRefresh}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                            title="지금 새로고침"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <SlowQueryList 
                onPidSelect={setSelectedPid}
                onRefresh={handleRefresh}
                autoRefresh={isAutoRefreshEnabled}
            />
            <QueryExplain selectedPid={selectedPid}/>
        </div>
    );
}