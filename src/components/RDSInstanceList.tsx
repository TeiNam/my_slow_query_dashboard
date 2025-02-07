import { useState, useEffect } from 'react';
import { Database, RefreshCw, Server, Clock, Check, X } from 'lucide-react';
import { collectRDSInstances, getRDSInstances } from '../api/queries';
import { RDSInstance, CollectRDSResponse } from '../types/api';
import { useCallback } from 'react';

// 디바운스 유틸리티 함수
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function RDSInstanceList() {
    const [instances, setInstances] = useState<RDSInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [collecting, setCollecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collectResponse, setCollectResponse] = useState<CollectRDSResponse | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1초

    const fetchInstances = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getRDSInstances();
            setInstances(data);
            if (data.length > 0) {
                const latestUpdate = data.reduce((latest: string, current: RDSInstance) => {
                    return latest > current.updateTime ? latest : current.updateTime;
                }, data[0].updateTime);
                setLastUpdateTime(latestUpdate);
            }
            setRetryCount(0); // 성공시 재시도 카운트 초기화
        } catch (err) {
            console.error('Error fetching instances:', err);
            const errorMessage = err instanceof Error ? err.message : '인스턴스 목록을 가져오는데 실패했습니다.';

            // 재시도 로직
            if (retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                    fetchInstances();
                }, RETRY_DELAY);
                return;
            }

            setError(errorMessage);
            setInstances([]);
            setLastUpdateTime(null);
        } finally {
            setLoading(false);
        }
    }, [retryCount]);

    // 새로고침용 디바운스 함수
    const debouncedRefresh = useCallback(
        debounce(() => fetchInstances(), 1000),
        [fetchInstances]
    );

    const handleCollect = async () => {
        try {
            setCollecting(true);
            const response = await collectRDSInstances();
            setCollectResponse(response);
            await fetchInstances();
        } catch (err) {
            setError('인스턴스 수집에 실패했습니다.');
            console.error('Error collecting instances:', err);
        } finally {
            setCollecting(false);
        }
    };

    useEffect(() => {
        // 초기 로딩은 즉시 실행
        fetchInstances();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul'
        });
    };

    const hasRealTimeTag = (instance: RDSInstance) => {
        if (!instance.Tags) return false;
        if (typeof instance.Tags === 'object' && !Array.isArray(instance.Tags)) {
            return (instance.Tags as Record<string, string>)['real_time_slow_sql'] === 'true';
        }
        return false;
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded" />
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-8">
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        {retryCount > 0 && retryCount < MAX_RETRIES ?
                            `재시도 중... (${retryCount}/${MAX_RETRIES})` : ''}
                    </p>
                    <button
                        onClick={debouncedRefresh}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        다시 시도
                    </button>
                </div>
            );
        }

        if (!instances.length) {
            return (
                <div className="text-center py-8">
                    <Server className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">RDS 인스턴스 없음</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        현재 등록된 RDS 인스턴스가 없습니다.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={handleCollect}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
                            인스턴스 수집
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                    <tr>
                        <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Instance ID
                        </th>
                        <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Real-time
                        </th>
                        <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Engine
                        </th>
                        <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Version
                        </th>
                        <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Endpoint
                        </th>
                        <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created At
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {instances.map((instance) => (
                        <tr key={instance.DBInstanceIdentifier} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Server className="w-4 h-4 mr-2 text-gray-500"/>
                                    {instance.DBInstanceIdentifier}
                                </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <div className="flex items-center">  {/* justify-center 제거 */}
                                    {hasRealTimeTag(instance) ? (
                                        <div className="p-1 bg-green-100 rounded-full">
                                            <Check className="w-4 h-4 text-green-600"/>
                                        </div>
                                    ) : (
                                        <div className="p-1 bg-red-100 rounded-full">
                                            <X className="w-4 h-4 text-red-600"/>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {instance.Engine}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {instance.EngineVersion}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {instance.Endpoint
                                    ? `${instance.Endpoint.Address}:${instance.Endpoint.Port}`
                                    : '-'
                                }
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-gray-500"/>
                                    {formatDate(instance.InstanceCreateTime)}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow w-full">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            RDS Instances
                        </h3>
                        {lastUpdateTime && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                마지막 갱신: {formatDate(lastUpdateTime)}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleCollect}
                        disabled={collecting || loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
                        인스턴스 수집
                    </button>
                </div>

                {collectResponse && (
                    <div className={`mb-4 p-4 rounded-md ${
                        collectResponse.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                        <p>{collectResponse.message}</p>
                        <p className="text-sm mt-1">수집된 인스턴스: {collectResponse.collected_count}개</p>
                    </div>
                )}

                {renderContent()}
            </div>
        </div>
    );
}