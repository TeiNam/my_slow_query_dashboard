import { useState, useEffect } from 'react';
import { format, subMonths, parse, addMonths } from 'date-fns';
import { BarChart as ChartBar, Calendar, Filter } from 'lucide-react';
import { getSQLStatistics, getUserStatistics, getRDSInstances } from '../api/queries';
import { SQLStatistics, UserStatistics } from '../types/api';
import { StatisticsTable } from '../components/StatisticsTable';
import { UserStatisticsTable } from '../components/UserStatisticsTable';
import MetricsChart from '../components/MetricsChart';
import * as Popover from '@radix-ui/react-popover';

export function StatisticsPage() {
    const [statistics, setStatistics] = useState<SQLStatistics[]>([]);
    const [prevMonthStatistics, setPrevMonthStatistics] = useState<SQLStatistics[]>([]);
    const [userStatistics, setUserStatistics] = useState<UserStatistics[]>([]);
    const [prevMonthUserStatistics, setPrevMonthUserStatistics] = useState<UserStatistics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'));
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [sqlSelectedInstances, setSqlSelectedInstances] = useState<string[]>([]);
    const [userSelectedInstances, setUserSelectedInstances] = useState<string[]>([]);
    const [chartSelectedInstances, setChartSelectedInstances] = useState<string[]>([]);

    // 최근 12개월 목록 생성
    const getRecentMonths = () => {
        const months = [];
        for (let i = 1; i < 7; i++) {
            const date = subMonths(new Date(), i);
            months.push(format(date, 'yyyy-MM'));
        }
        return months.reverse();
    };

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const prevMonth = format(subMonths(parse(selectedMonth, 'yyyy-MM', new Date()), 1), 'yyyy-MM');

            const [statsData, userStatsData, prevStatsData, prevUserStatsData] = await Promise.all([
                getSQLStatistics(selectedMonth),
                getUserStatistics(selectedMonth),
                getSQLStatistics(prevMonth),
                getUserStatistics(prevMonth)
            ]);

            setStatistics(statsData);
            setPrevMonthStatistics(prevStatsData);
            setUserStatistics(userStatsData);
            setPrevMonthUserStatistics(prevUserStatsData);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
            setError('통계 데이터를 가져오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, [selectedMonth]);

    return (
        <div className="space-y-6 px-4 sm:px-6 md:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        SQL 실행 통계
                    </h2>
                    <div className="flex items-center gap-4">
                        <Popover.Root open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
                            <Popover.Trigger asChild>
                                <button
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <Calendar className="w-4 h-4" />
                                    {parse(selectedMonth, 'yyyy-MM', new Date()).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long'
                                    })}
                                    통계
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    className="bg-white rounded-md shadow-lg p-2 w-48"
                                    sideOffset={5}
                                >
                                    <div className="space-y-1">
                                        {getRecentMonths().map((month) => (
                                            <button
                                                key={month}
                                                onClick={() => {
                                                    setSelectedMonth(month);
                                                    setIsMonthPickerOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                                                    month === selectedMonth
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'hover:bg-gray-100'
                                                }`}
                                            >
                                                {parse(month, 'yyyy-MM', new Date()).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long'
                                                })}
                                            </button>
                                        ))}
                                    </div>
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-700">{error}</p>
                </div>
            ) : statistics.length > 0 ? (
                <>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">인스턴스별 통계</h3>
                        <StatisticsTable
                            data={statistics}
                            prevMonthData={prevMonthStatistics}
                            selectedInstances={sqlSelectedInstances}
                            onInstanceFilter={setSqlSelectedInstances}
                        />
                    </div>
                    <MetricsChart
                        data={statistics}
                        prevMonthData={prevMonthStatistics}
                        selectedInstances={chartSelectedInstances}
                        onInstanceFilter={setChartSelectedInstances}
                    />
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">사용자별 통계</h3>
                        <UserStatisticsTable
                            data={userStatistics}
                            prevMonthData={prevMonthUserStatistics}
                            selectedInstances={userSelectedInstances}
                            onInstanceFilter={setUserSelectedInstances}
                        />
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <ChartBar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">데이터 없음</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {selectedMonth}에 대한 통계 데이터가 없습니다.
                    </p>
                </div>
            )}
        </div>
    );
}