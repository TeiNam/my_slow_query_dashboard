import { useState } from 'react';
import { QueryExplain } from '../components/QueryExplain';
import { SlowQueryList } from '../components/SlowQueryList';

export function MySQLMonitorPage() {
    const [selectedPid, setSelectedPid] = useState<string>('');
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    // 새로고침 완료 처리 (단순히 마지막 새로고침 시간만 업데이트)
    const handleRefreshComplete = () => {
        setLastRefreshed(new Date());
    };

    return (
        <div className="space-y-6 px-4 sm:px-6 md:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        MySQL Real-time Slow Query Monitor
                    </h2>
                    <h4 className="text-base italic leading-7 text-gray-500 ml-4 sm:truncate sm:text-base sm:tracking-tight">
                        = AWS Aurora for MySQL & RDS =
                    </h4>
                </div>
            </div>

            <SlowQueryList
                onPidSelect={setSelectedPid}
                onRefreshComplete={handleRefreshComplete}
                lastRefreshed={lastRefreshed}
            />
            <QueryExplain selectedPid={selectedPid}/>
        </div>
    );
}
