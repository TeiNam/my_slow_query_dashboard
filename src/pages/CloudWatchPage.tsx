import React, { useState, useEffect } from 'react';
import { CloudWatchMonitor } from '../components/CloudWatchMonitor';
import { SlowQueryDigestTable } from '../components/SlowQueryDigestTable';
import { getSlowQueryStats } from '../api/queries';
import { SlowQueryDigestResponse } from '../types/api';

export function CloudWatchPage() {
    const [queryStats, setQueryStats] = useState<SlowQueryDigestResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchQueryStats = async () => {
        try {
            setLoading(true);
            const data = await getSlowQueryStats();
            setQueryStats(data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch query stats:', error);
            setError('Failed to fetch query statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueryStats();
    }, []);

    return (
        <div className="space-y-6 px-4 sm:px-6 md:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        CloudWatch Slow Query Monitor
                    </h2>
                </div>
            </div>

            <CloudWatchMonitor />

            {loading ? (
                <div className="mt-8 bg-white rounded-lg shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="animate-pulse space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="mt-8 bg-white rounded-lg shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="text-red-600">{error}</div>
                    </div>
                </div>
            ) : queryStats?.stats ? (
                <SlowQueryDigestTable
                    stats={queryStats.stats}
                    month={queryStats.month}
                />
            ) : (
                <div className="mt-8 bg-white rounded-lg shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="text-gray-600">No query statistics available</div>
                    </div>
                </div>
            )}
        </div>
    );
}