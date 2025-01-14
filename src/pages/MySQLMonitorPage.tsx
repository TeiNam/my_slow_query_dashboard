import React from 'react';
import { MySQLMonitor } from '../components/MySQLMonitor';
import { QueryExplain } from '../components/QueryExplain';
import { MonitorStatus } from '../components/MonitorStatus';
import { SlowQueryList } from '../components/SlowQueryList';

export function MySQLMonitorPage() {
    return (
        <div className="px-4 sm:px-6 md:px-8 space-y-6">  {/* padding 값을 줄임 */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        MySQL Slow Query Monitor
                    </h2>
                    <h4 className="text-base italic leading-7 text-gray-500 ml-36 sm:truncate sm:text-base sm:tracking-tight">
                        - AWS Aurora for MySQL & RDS
                    </h4>
                </div>
            </div>

            <MonitorStatus/>
            <MySQLMonitor/>
            <SlowQueryList/>
            <QueryExplain/>
        </div>
    );
}