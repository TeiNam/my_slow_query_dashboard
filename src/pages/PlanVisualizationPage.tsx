import { useState, useEffect } from 'react';
import { Database, Clock, Filter, Hash } from 'lucide-react';
import { ExplainPlanListResponse, ExplainPlan } from '../types/api';
import { QueryInformation } from '../components/QueryInformation';
import { QueryPlanVisualization } from '../components/QueryPlanVisualization';
import { QueryPlanDetails } from '../components/QueryPlanDetails';

export function PlanVisualizationPage() {
    const [plans, setPlans] = useState<ExplainPlanListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedInstance, setSelectedInstance] = useState<string>('');
    const [instances, setInstances] = useState<string[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<ExplainPlan | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const baseUrl = import.meta.env.VITE_API_BASE_URL;
            let url = `${baseUrl}/explain/plans?page=${currentPage}&page_size=5`;

            if (selectedInstance) {
                url += `&instance=${encodeURIComponent(selectedInstance)}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch plans');
            const data = await response.json();
            setPlans(data);

            if (data.items && !selectedInstance) {
                const uniqueInstances = Array.from(
                    new Set(data.items.map((item: ExplainPlan) => item.instance))
                ).sort();
                setInstances(uniqueInstances);
            }

            setError(null);
        } catch (err) {
            setError('Failed to fetch explain plans');
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [selectedInstance, currentPage]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul'
        });
    };

    const totalPages = plans ? Math.ceil(plans.total / plans.page_size) : 0;

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPages = Math.min(totalPages, 10);
        let startPage = Math.max(1, currentPage - 4);
        let endPage = Math.min(startPage + maxPages - 1, totalPages);

        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    };

    if (error) {
        return (
            <div className="px-4 sm:px-6 md:px-8">
                <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 md:px-8 space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Query Plan Visualization
                    </h2>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            Recent Explain Plans
                        </h3>
                        <div className="flex items-center">
                            {/* 인스턴스 필터 */}
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={selectedInstance}
                                    onChange={(e) => setSelectedInstance(e.target.value)}
                                    className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">All Instances</option>
                                    {instances.map((instance) => (
                                        <option key={instance} value={instance}>{instance}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                    <colgroup>
                                        <col className="w-[180px]" />
                                        <col className="w-[100px]" />
                                        <col className="w-[140px]" />
                                        <col className="w-[100px]" />
                                        <col />
                                    </colgroup>
                                    <thead>
                                    <tr>
                                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
                                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instance</th>
                                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {plans?.items.map((plan, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => setSelectedPlan(plan)}
                                        >
                                            <td className="px-2 py-2 whitespace-nowrap text-sm">
                                                {formatDate(plan.created_at)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-sm">
                                                    <span className="flex items-center">
                                                        <Hash className="w-4 h-4 mr-1 flex-shrink-0"/>
                                                        {plan.pid}
                                                    </span>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-sm">
                                                    <span className="flex items-center">
                                                        <Database className="w-4 h-4 mr-1 flex-shrink-0"/>
                                                        {plan.instance}
                                                    </span>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-sm">
                                                    <span className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-1 flex-shrink-0"/>
                                                        {Math.round(plan.time)}s
                                                    </span>
                                            </td>
                                            <td className="px-2 py-2 text-sm">
                                                <div className="truncate">
                                                    {plan.sql_text}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-6">
                                <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
                                    <div className="flex w-0 flex-1">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                                        >
                                            {' <<'}
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                                        >
                                            {'<'}
                                        </button>
                                    </div>
                                    <div className="hidden md:flex">
                                        {getPageNumbers().map((number) => (
                                            <button
                                                key={number}
                                                onClick={() => setCurrentPage(number)}
                                                className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                                                    currentPage === number
                                                        ? 'border-blue-500 text-blue-600'
                                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                }`}
                                            >
                                                {number}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex w-0 flex-1 justify-end">
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                                        >
                                            {'>'}
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                                        >
                                            {'>>'}
                                        </button>
                                    </div>
                                </nav>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {selectedPlan && (
                <>
                    <QueryInformation plan={selectedPlan} />
                    {selectedPlan.explain_result && (
                        <>
                            <QueryPlanVisualization explainResult={selectedPlan.explain_result} />
                            <QueryPlanDetails explainResult={selectedPlan.explain_result} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}