import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SQLStatistics } from '../types/api';
import { Database } from 'lucide-react';
import { InstanceFilter } from './InstanceFilter';

interface MetricsChartProps {
    data: SQLStatistics[];
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
    { key: 'slow_query_count', label: '슬로우 쿼리 수', color: '#3b82f6' },
    { key: 'execution_count', label: '전체 실행 횟수', color: '#60a5fa' },
    { key: 'execution_time', label: '전체 실행 시간 (초)', color: '#93c5fd' },
    { key: 'avg_execution_time', label: '평균 실행 시간 (초)', color: '#bfdbfe' },
    { key: 'rows_examined', label: '전체 조회 행 수', color: '#dbeafe' }
];

export default function MetricsChart({ data, selectedInstances, onInstanceFilter }: MetricsChartProps) {
    const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['slow_query_count', 'execution_count']);
    const instances = Array.from(new Set(data.map(stat => stat.instance_id)));

    const filteredData = selectedInstances.length > 0
        ? data.filter(stat => selectedInstances.includes(stat.instance_id))
        : data;

    const chartData = filteredData.map(stat => ({
        name: stat.instance_id,
        slow_query_count: stat.total_slow_query_count,
        execution_count: stat.total_execution_count,
        execution_time: stat.total_execution_time,
        avg_execution_time: stat.avg_execution_time,
        rows_examined: stat.total_rows_examined,
    }));

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
                                <Bar
                                    key={metric.key}
                                    name={metric.label}
                                    dataKey={metric.key}
                                    fill={metric.color}
                                />
                            )
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}