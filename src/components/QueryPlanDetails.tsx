import { FileText } from 'lucide-react';

interface Operation {
    using_temporary_table?: boolean;
    using_filesort?: boolean;
    nested_loop?: Array<{ table: TableInfo }>;
    table?: TableInfo;
}

interface QueryBlock {
    select_id?: number;
    cost_info?: {
        query_cost: string;
    };
    ordering_operation?: Operation;
    grouping_operation?: Operation;
    duplicates_removal?: Operation;
    nested_loop?: Array<{ table: TableInfo }>;
    table?: TableInfo;
}

interface CostInfo {
    read_cost: string;
    eval_cost: string;
    prefix_cost: string;
    data_read_per_join?: string;
    query_cost?: string;
}

interface TableInfo {
    table_name?: string;
    access_type?: string;
    rows_examined_per_scan?: number;
    rows_produced_per_join?: number;
    filtered?: string;
    cost_info?: CostInfo;
    used_columns?: string[] | string;
    possible_keys?: string[] | string;
    key?: string;
    key_length?: string;
    ref?: string[];
    used_key_parts?: string[];
    using_join_buffer?: string;
    index_condition?: string;
    attached_condition?: string;
}

interface QueryPlanDetailsProps {
    explainResult: {
        json: {
            query_block: QueryBlock;
        };
    } | null;
}

const formatValue = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
};

const getTablesFromOperation = (operation: Operation | undefined): TableInfo[] => {
    if (!operation) return [];

    if (operation.nested_loop) {
        return operation.nested_loop.map(item => item.table);
    }

    if (operation.table) {
        return [operation.table];
    }

    return [];
};

const getOperationType = (queryBlock: QueryBlock): string => {
    if (queryBlock.ordering_operation) return '정렬 작업';
    if (queryBlock.grouping_operation) return '그룹화 작업';
    if (queryBlock.duplicates_removal) return '중복 제거';
    if (queryBlock.nested_loop) return '중첩 루프 조인';
    if (queryBlock.table) return '테이블 스캔';
    return '기본 작업';
};

const getOperationDetails = (queryBlock: QueryBlock): Operation | undefined => {
    return queryBlock.ordering_operation ||
        queryBlock.grouping_operation ||
        queryBlock.duplicates_removal ||
        (queryBlock.nested_loop ? { nested_loop: queryBlock.nested_loop } : undefined) ||
        (queryBlock.table ? { table: queryBlock.table } : undefined);
};

const TableDetails = ({ table }: { table: TableInfo }) => {
    if (!table) return null;

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="text-base font-semibold text-gray-700">
                    {table.table_name || '테이블 정보'}
                </h4>
            </div>

            <div className="divide-y">
                {/* 접근 정보 */}
                <div className="px-4 py-3 bg-blue-50">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">접근 정보</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {table.access_type && (
                            <div>
                                <span className="text-gray-600">접근 유형:</span>
                                <span className="ml-2 font-medium">{table.access_type}</span>
                            </div>
                        )}
                        {table.rows_examined_per_scan && (
                            <div>
                                <span className="text-gray-600">스캔당 검사 행수:</span>
                                <span className="ml-2 font-medium">{table.rows_examined_per_scan.toLocaleString()}</span>
                            </div>
                        )}
                        {table.rows_produced_per_join && (
                            <div>
                                <span className="text-gray-600">조인당 생성 행수:</span>
                                <span className="ml-2 font-medium">{table.rows_produced_per_join.toLocaleString()}</span>
                            </div>
                        )}
                        {table.filtered && (
                            <div>
                                <span className="text-gray-600">필터링:</span>
                                <span className="ml-2 font-medium">{table.filtered}%</span>
                            </div>
                        )}
                        {table.using_join_buffer && (
                            <div>
                                <span className="text-gray-600">조인 버퍼:</span>
                                <span className="ml-2 font-medium">{table.using_join_buffer}</span>
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
                                <span className="text-gray-600">읽기 비용:</span>
                                <span className="ml-2 font-medium">{table.cost_info.read_cost}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">평가 비용:</span>
                                <span className="ml-2 font-medium">{table.cost_info.eval_cost}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">접두 비용:</span>
                                <span className="ml-2 font-medium">{table.cost_info.prefix_cost}</span>
                            </div>
                            {table.cost_info.data_read_per_join && (
                                <div>
                                    <span className="text-gray-600">조인당 읽기 데이터:</span>
                                    <span className="ml-2 font-medium">{table.cost_info.data_read_per_join}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 키 및 인덱스 정보 */}
                <div className="px-4 py-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">키 및 인덱스</h5>
                    <div className="space-y-2 text-sm">
                        {table.possible_keys && (
                            <div>
                                <span className="text-gray-600">사용 가능한 키:</span>
                                <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                    {formatValue(table.possible_keys)}
                                </div>
                            </div>
                        )}
                        {table.key && (
                            <div>
                                <span className="text-gray-600">사용된 키:</span>
                                <div className="mt-1 text-xs bg-gray-50 p-2 rounded">{table.key}</div>
                            </div>
                        )}
                        {table.key_length && (
                            <div>
                                <span className="text-gray-600">키 길이:</span>
                                <div className="mt-1 text-xs bg-gray-50 p-2 rounded">{table.key_length}</div>
                            </div>
                        )}
                        {table.ref && table.ref.length > 0 && (
                            <div>
                                <span className="text-gray-600">참조:</span>
                                <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                    {formatValue(table.ref)}
                                </div>
                            </div>
                        )}
                        {table.used_key_parts && table.used_key_parts.length > 0 && (
                            <div>
                                <span className="text-gray-600">사용된 키 파트:</span>
                                <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                    {formatValue(table.used_key_parts)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 조건 및 컬럼 정보 */}
                <div className="px-4 py-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">조건 및 사용된 컬럼</h5>
                    <div className="space-y-2 text-sm">
                        {table.used_columns && (
                            <div>
                                <span className="text-gray-600">사용된 컬럼:</span>
                                <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                    {formatValue(table.used_columns)}
                                </div>
                            </div>
                        )}
                        {table.index_condition && (
                            <div>
                                <span className="text-gray-600">인덱스 조건:</span>
                                <div className="mt-1 text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">
                                    {table.index_condition}
                                </div>
                            </div>
                        )}
                        {table.attached_condition && (
                            <div>
                                <span className="text-gray-600">추가 조건:</span>
                                <div className="mt-1 text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">
                                    {table.attached_condition}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export function QueryPlanDetails({ explainResult }: QueryPlanDetailsProps) {
    if (!explainResult?.json?.query_block) {
        return null;
    }

    const queryBlock = explainResult.json.query_block;
    const operation = getOperationDetails(queryBlock);
    const tables = operation ? getTablesFromOperation(operation) : [];

    if (tables.length === 0) {
        return null;
    }

    const operationType = getOperationType(queryBlock);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    실행 계획 상세 - {operationType}
                </h3>
                {queryBlock.cost_info && (
                    <div className="text-sm text-gray-600">
                        전체 쿼리 비용: {queryBlock.cost_info.query_cost}
                    </div>
                )}
                {operation?.using_temporary_table && (
                    <div className="text-sm text-yellow-600 mt-1">
                        ※ 임시 테이블 사용됨
                    </div>
                )}
                {operation?.using_filesort && (
                    <div className="text-sm text-yellow-600">
                        ※ 파일 정렬 사용됨
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {tables.map((table, index) => (
                    <TableDetails key={index} table={table} />
                ))}
            </div>
        </div>
    );
}