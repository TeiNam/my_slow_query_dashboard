import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SQLStatistics } from '../types/api';
import { Database } from 'lucide-react';
import { InstanceFilter } from './InstanceFilter';

interface StatisticsChartProps {
    data: SQLStatistics[];
    onInstanceFilter: (instances: string[]) => void;
    selectedInstances: string[];
}

export function StatisticsChart({ data, onInstanceFilter, selectedInstances }: StatisticsChartProps) {
    const [chartMetric, setChartMetric] = useState<'execution' | 'queries' | 'rows'>('execution');
    const instances = Array.from(new Set(data.map(stat => stat.instance_id)));
    const filteredData = selectedInstances.length > 0
        ? data.filter(stat => selectedInstances.includes(stat.instance_id))
        : data;

    // 인스턴스 ID를 인덱스로 변환하는 함수
    const getInstanceLabel = (instanceId: string) => {
        const index = instances.indexOf(instanceId) + 1;
        return `Instance ${index}`;
    };

    const chartData = filteredData.map(stat => ({
        name: getInstanceLabel(stat.instance_id),
        total_execution_time: chartMetric === 'execution' ? stat.total_execution_time : undefined,
        avg_execution_time: chartMetric === 'execution' ? stat.avg_execution_time : undefined,
        slow_queries: chartMetric === 'queries' ? stat.total_slow_query_count : undefined,
        unique_digests: chartMetric === 'queries' ? stat.unique_digest_count : undefined,
        total_executions: chartMetric === 'queries' ? stat.total_execution_count : undefined,
        rows_examined: chartMetric === 'rows' ? stat.total_rows_examined : undefined,
        read_queries: chartMetric === 'queries' ? stat.read_query_count : undefined,
        write_queries: chartMetric === 'queries' ? stat.write_query_count : undefined,
        ddl_queries: chartMetric === 'queries' ? stat.ddl_query_count : undefined,
        commit_queries: chartMetric === 'queries' ? stat.commit_query_count : undefined
    }));

    const renderChart = () => {
        switch (chartMetric) {
            case 'execution':
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="전체 실행 시간 (초)" dataKey="total_execution_time" fill="#3b82f6" />
                        <Bar name="평균 실행 시간 (초)" dataKey="avg_execution_time" fill="#93c5fd" />
                    </BarChart>
                );
            case 'queries':
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="슬로우 쿼리 수" dataKey="slow_queries" fill="#3b82f6" />
                        <Bar name="고유 다이제스트 수" dataKey="unique_digests" fill="#93c5fd" />
                        <Bar name="전체 실행 횟수" dataKey="total_executions" fill="#60a5fa" />
                        <Bar name="읽기 쿼리" dataKey="read_queries" fill="#34d399" />
                        <Bar name="쓰기 쿼리" dataKey="write_queries" fill="#f87171" />
                        <Bar name="DDL 쿼리" dataKey="ddl_queries" fill="#c084fc" />
                        <Bar name="Commit 쿼리" dataKey="commit_queries" fill="#fb923c" />
                    </BarChart>
                );
            case 'rows':
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="전체 조회 행 수" dataKey="rows_examined" fill="#3b82f6" />
                    </BarChart>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    인스턴스별 통계
                </h3>
                <div className="flex items-center gap-4">
                    <InstanceFilter
                        instances={instances}
                        selectedInstances={selectedInstances}
                        onChange={onInstanceFilter}
                    />
                    <select
                        value={chartMetric}
                        onChange={(e) => setChartMetric(e.target.value as typeof chartMetric)}
                        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    >
                        <option value="execution">실행 시간</option>
                        <option value="queries">쿼리 통계</option>
                        <option value="rows">조회 행 수</option>
                    </select>
                </div>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
}