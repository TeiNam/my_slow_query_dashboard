import React from 'react';
import { FileText } from 'lucide-react';

interface TableInfo {
    table_name?: string;
    access_type?: string;
    rows?: number;
    filtered?: string;
    cost_info?: {
        read_cost: string;
        eval_cost: string;
        prefix_cost: string;
        data_read_per_join?: string;
    };
    used_columns?: string;
    possible_keys?: string;
    key?: string;
    used_key_parts?: string[];
    index_condition?: string;
    attached_condition?: string;
    data_read_per_join?: string;
}

interface QueryPlanDetailsProps {
    explainResult: {
        json: {
            query_block: {
                ordering_operation?: {
                    nested_loop?: Array<{
                        table: TableInfo;
                    }>;
                };
            };
        };
    } | null;
}

const formatList = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') {
        return value.split(',').map(item => item.trim()).join(', ');
    }
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return String(value);
};

export function QueryPlanDetails({ explainResult }: QueryPlanDetailsProps) {
    if (!explainResult?.json?.query_block?.ordering_operation?.nested_loop) {
        return null;
    }

    const tables = explainResult.json.query_block.ordering_operation.nested_loop.map(loop => loop.table);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Table Access Details
            </h3>

            <div className="space-y-6">
                {tables.map((table, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                            <h4 className="text-base font-semibold text-gray-700">
                                {table.table_name || `Table ${index + 1}`}
                            </h4>
                        </div>

                        <div className="divide-y">
                            {/* 일반 정보 */}
                            <div className="px-4 py-3 bg-blue-50">
                                <h5 className="text-sm font-medium text-blue-900 mb-2">일반 정보</h5>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {table.access_type && (
                                        <div>
                                            <span className="text-gray-600">접근 유형(access_type):</span>
                                            <span className="ml-2 font-medium">{table.access_type}</span>
                                        </div>
                                    )}
                                    {table.rows && (
                                        <div>
                                            <span className="text-gray-600">처리 행수(rows):</span>
                                            <span className="ml-2 font-medium">{table.rows}</span>
                                        </div>
                                    )}
                                    {table.filtered && (
                                        <div>
                                            <span className="text-gray-600">필터링(filtered):</span>
                                            <span className="ml-2 font-medium">{table.filtered}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 비용 정보 */}
                            {table.cost_info && (
                                <div className="px-4 py-3 bg-green-50">
                                    <h5 className="text-sm font-medium text-green-900 mb-2">비용 정보</h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">읽기 비용(read_cost):</span>
                                            <span className="ml-2 font-medium">{table.cost_info.read_cost}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">평가 비용(eval_cost):</span>
                                            <span className="ml-2 font-medium">{table.cost_info.eval_cost}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">접두 비용(prefix_cost):</span>
                                            <span className="ml-2 font-medium">{table.cost_info.prefix_cost}</span>
                                        </div>
                                        {table.cost_info.data_read_per_join && (
                                            <div>
                                                <span className="text-gray-600">조인당 읽기 데이터(data_read_per_join):</span>
                                                <span className="ml-2 font-medium">{table.cost_info.data_read_per_join}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 상세 정보 */}
                            <div className="px-4 py-3">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">상세 정보</h5>
                                <div className="space-y-2 text-sm">
                                    {table.possible_keys && (
                                        <div>
                                            <span className="text-gray-600">사용 가능한 키(possible_keys):</span>
                                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                                {formatList(table.possible_keys)}
                                            </div>
                                        </div>
                                    )}
                                    {table.key && (
                                        <div>
                                            <span className="text-gray-600">사용된 키(key):</span>
                                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                                {table.key}
                                            </div>
                                        </div>
                                    )}
                                    {table.used_key_parts && table.used_key_parts.length > 0 && (
                                        <div>
                                            <span className="text-gray-600">사용된 키 구성요소(used_key_parts):</span>
                                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                                {formatList(table.used_key_parts)}
                                            </div>
                                        </div>
                                    )}
                                    {table.used_columns && (
                                        <div>
                                            <span className="text-gray-600">사용된 컬럼(used_columns):</span>
                                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                                {formatList(table.used_columns)}
                                            </div>
                                        </div>
                                    )}
                                    {table.index_condition && (
                                        <div>
                                            <span className="text-gray-600">인덱스 조건(index_condition):</span>
                                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                                {table.index_condition}
                                            </div>
                                        </div>
                                    )}
                                    {table.attached_condition && (
                                        <div>
                                            <span className="text-gray-600">조건절(attached_condition):</span>
                                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                                {table.attached_condition}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}