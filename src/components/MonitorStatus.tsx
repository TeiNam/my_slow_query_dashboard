import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { MonitorResponse } from '../types/api';

export function MonitorStatus() {
  const [status, setStatus] = useState<MonitorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/mysql/status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch monitoring status');
      console.error('Error fetching status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // 10초마다 상태 업데이트
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Activity className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg animate-pulse">
        <div className="flex items-center space-x-3">
          <Activity className="h-5 w-5 text-gray-400" />
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    );
  }

  const statusColor = status.status === 'running' ? 'green' : 'yellow';
  const statusText = status.status === 'running' ? '모니터링 실행 중' : '모니터링 중지됨';

  return (
    <div className={`bg-${statusColor}-50 p-4 rounded-lg`}>
      <div className="flex items-center">
        <Activity className={`h-5 w-5 text-${statusColor}-500 animate-pulse`} />
        <div className="ml-3">
          <h3 className={`text-sm font-medium text-${statusColor}-800`}>
            {statusText}
          </h3>
          <p className={`mt-1 text-sm text-${statusColor}-700`}>
            마지막 업데이트: {new Date(status.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}