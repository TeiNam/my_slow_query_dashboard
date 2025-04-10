import { UserStatistics } from '../types/api';
import { Database, User, Clock, FileText, Search, Edit, Table2 } from 'lucide-react';
import { InstanceFilter } from './InstanceFilter';

interface UserStatisticsTableProps {
    data: UserStatistics[];
    onInstanceFilter: (instances: string[]) => void;
    selectedInstances: string[];
}

export function UserStatisticsTable({ data, onInstanceFilter, selectedInstances }: UserStatisticsTableProps) {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">사용자별 통계 데이터가 없습니다.</p>
            </div>
        );
    }

    const instances = Array.from(new Set(data.map(stat => stat.instance_id)));
    const filteredData = selectedInstances.length > 0
        ? data.filter(stat => selectedInstances.includes(stat.instance_id))
        : data;

    return (
        <div>
            <InstanceFilter
                instances={instances}
                selectedInstances={selectedInstances}
                onChange={onInstanceFilter}
            />
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                    <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Instance
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전체 쿼리 수
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
                            쿼리 유형
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((stat, index) => (
                        <tr key={`${stat.instance_id}-${stat.user}-${index}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Database className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.instance_id}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.user}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Search className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.total_queries.toLocaleString()}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.total_exec_count.toLocaleString()}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.total_exec_time.toFixed(2)}s
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                    {stat.avg_execution_time.toFixed(2)}s
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      읽기: {stat.read_query_count}
                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      쓰기: {stat.write_query_count}
                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      DDL: {stat.ddl_query_count}
                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Commit: {stat.commit_query_count}
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