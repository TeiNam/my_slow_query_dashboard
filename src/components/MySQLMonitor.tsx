import { useState, useEffect } from 'react';
import { startMySQLMonitoring, stopMySQLMonitoring, getMySQLStatus } from '../api/queries';
import { MonitorResponse } from '../types/api';
import { Database, Activity } from 'lucide-react';

export function MySQLMonitor() {
  const [status, setStatus] = useState<MonitorResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    try {
      const result = await getMySQLStatus();
      setStatus(result);
    } catch (error) {
      console.error('Error checking MySQL status:', error);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStartMonitoring = async () => {
    try {
      setLoading(true);
      await startMySQLMonitoring();
      await checkStatus();
    } catch (error) {
      console.error('Error starting monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    try {
      setLoading(true);
      await stopMySQLMonitoring();
      await checkStatus();
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="p-6 bg-white rounded-lg shadow-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            MySQL Slow Query Scraper
          </h2>
          {status?.status === 'running' && (
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500 animate-pulse" />
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                      <div
                          key={i}
                          className="w-1 h-3 bg-green-500 rounded-full animate-wave"
                          style={{
                            animation: `wave 1s ease-in-out ${i * 0.2}s infinite`,
                          }}
                      />
                  ))}
                </div>
              </div>
          )}
        </div>

        <div className="space-x-4">
          <button
              onClick={handleStartMonitoring}
              disabled={loading || status?.status === 'running'}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            Start Monitoring
          </button>
          <button
              onClick={handleStopMonitoring}
              disabled={loading || status?.status !== 'running'}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            Stop Monitoring
          </button>
        </div>

        {status && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="font-medium">Status: {status.status}</p>
              <p className="text-gray-600">{status.message}</p>
              <p className="text-sm text-gray-500">
                Last Updated: {new Date(status.timestamp).toLocaleString()}
              </p>
            </div>
        )}
      </div>
  );
}