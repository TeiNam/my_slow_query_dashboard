import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SQLStatistics } from '../types/api';
import { Database } from 'lucide-react';
import { InstanceFilter } from './InstanceFilter';

interface MetricsChartProps {
    data: SQLStatistics[];
    prevMonthData: SQLStatistics[];
    selectedInstances: string[];
    onInstanceFilter: (instances: string[]) => void;
}

type MetricKey = 'slow_query_count' | 'execution_count' | 'execution_time' | 'avg_execution_time' | 'rows_examined';

interface MetricOption {
    key: MetricKey;
    label: string;
    color: string;
}

const METRICS: MetricOption[] = [
    { key: 'slow_query_count', label: '슬로우 쿼리 수', color: '#3b82f6' }, // 파란색
    { key: 'execution_count', label: '전체 실행 횟수', color: '#10b981' }, // 초록색
    { key: 'execution_time', label: '전체 실행 시간 (초)', color: '#f59e0b' }, // 주황색
    { key: 'avg_execution_time', label: '평균 실행 시간 (초)', color: '#8b5cf6' }, // 보라색
    { key: 'rows_examined', label: '전체 조회 행 수', color: '#ef4444' } // 빨간색
];

export function MetricsChart({ data, prevMonthData, selectedInstances, onInstanceFilter }: MetricsChartProps) {
    const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['slow_query_count', 'execution_count']);
    const [showComparison, setShowComparison] = useState(false);
    const instances = Array.from(new Set(data.map(stat => stat.instance_id)));

    const filteredData = selectedInstances.length > 0
        ? data.filter(stat => selectedInstances.includes(stat.instance_id))
        : data;

    const chartData = filteredData.map(stat => {
        // prevMonthData가 배열인지 확인하고 안전하게 처리
        const prevMonthStat = Array.isArray(prevMonthData)
            ? prevMonthData.find(p => p.instance_id === stat.instance_id)
            : null;

        const baseData = {
            name: stat.instance_id,
            slow_query_count: stat.total_slow_query_count ?? 0,
            execution_count: stat.total_execution_count ?? 0,
            execution_time: stat.total_execution_time ?? 0,
            avg_execution_time: stat.avg_execution_time ?? 0,
            rows_examined: stat.total_rows_examined ?? 0,
        };

        if (showComparison && prevMonthStat) {
            return {
                ...baseData,
                prev_slow_query_count: prevMonthStat.total_slow_query_count ?? 0,
                prev_execution_count: prevMonthStat.total_execution_count ?? 0,
                prev_execution_time: prevMonthStat.total_execution_time ?? 0,
                prev_avg_execution_time: prevMonthStat.avg_execution_time ?? 0,
                prev_rows_examined: prevMonthStat.total_rows_examined ?? 0,
            };
        }

        return baseData;
    });

    const handleMetricToggle = (metric: MetricKey) => {
        setSelectedMetrics(prev => {
            if (prev.includes(metric)) {
                return prev.filter(m => m !== metric);
            }
            return [...prev, metric];
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    인스턴스별 차트
                </h3>
                <div className="flex items-center gap-4">
                    <InstanceFilter
                        instances={instances}
                        selectedInstances={selectedInstances}
                        onChange={onInstanceFilter}
                    />
                    <button
                        onClick={() => setShowComparison(!showComparison)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            showComparison
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        전월 비교 {showComparison ? '끄기' : '켜기'}
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-end mb-4">
                <div className="flex gap-2">
                    {METRICS.map(metric => (
                        <button
                            key={metric.key}
                            onClick={() => handleMetricToggle(metric.key)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                selectedMetrics.includes(metric.key)
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {metric.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {METRICS.map(metric => (
                            selectedMetrics.includes(metric.key) && (
                                <>
                                    {showComparison && (
                                        <Bar
                                            key={`prev_${metric.key}`}
                                            name={`전월 ${metric.label}`}
                                            dataKey={`prev_${metric.key}`}
                                            fill="#94a3b8" // 회색으로 통일
                                        />
                                    )}
                                    <Bar
                                        key={metric.key}
                                        name={metric.label}
                                        dataKey={metric.key}
                                        fill={metric.color}
                                    />
                                </>
                            )
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default MetricsChart;