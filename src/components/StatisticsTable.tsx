import { useState } from 'react';
import { SQLStatistics } from '../types/api';
import { Database, Hash, Clock, FileText, Search, Edit, Table2 } from 'lucide-react';
import { InstanceFilter } from './InstanceFilter';

interface StatisticsTableProps {
    data: SQLStatistics[];
    prevMonthData: SQLStatistics[];
    onInstanceFilter: (instances: string[]) => void;
    selectedInstances: string[];
}

export function StatisticsTable({ data, prevMonthData, onInstanceFilter, selectedInstances }: StatisticsTableProps) {
    const [showComparison, setShowComparison] = useState(false);

    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">데이터가 없습니다.</p>
            </div>
        );
    }

    const instances = Array.from(new Set(data.map(stat => stat.instance_id)));
    const filteredData = selectedInstances.length > 0
        ? data.filter(stat => selectedInstances.includes(stat.instance_id))
        : data;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
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
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                    <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Instance
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            고유 다이제스트 수
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            슬로우 쿼리 수
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전체 실행 횟수
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전체 실행 시간
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            평균 실행 시간
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전체 조회 행 수
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            쿼리 유형
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((stat) => (
                        <tr key={stat.instance_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Database className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.instance_id}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.unique_digest_count?.toLocaleString() ?? '0'}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Search className="w-4 h-4 mr-2 text-gray-500" />
                                    <div className="flex flex-col">
                                        <span>{stat.total_slow_query_count?.toLocaleString() ?? '0'}</span>
                                        {showComparison && prevMonthData.find(p => p.instance_id === stat.instance_id) && (
                                            <span className="text-xs text-gray-500">
                                                전월: {prevMonthData.find(p => p.instance_id === stat.instance_id)?.total_slow_query_count?.toLocaleString() ?? '0'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                    <div className="flex flex-col">
                                        <span>{stat.total_execution_count?.toLocaleString() ?? '0'}</span>
                                        {showComparison && prevMonthData.find(p => p.instance_id === stat.instance_id) && (
                                            <span className="text-xs text-gray-500">
                                                전월: {prevMonthData.find(p => p.instance_id === stat.instance_id)?.total_execution_count?.toLocaleString() ?? '0'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                    {(stat.total_execution_time ?? 0).toFixed(2)}s
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                    {(stat.avg_execution_time ?? 0).toFixed(2)}s
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Table2 className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.total_rows_examined?.toLocaleString() ?? '0'}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      읽기: {stat.read_query_count ?? 0}
                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      쓰기: {stat.write_query_count ?? 0}
                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      DDL: {stat.ddl_query_count ?? 0}
                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Commit: {stat.commit_query_count ?? 0}
                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}