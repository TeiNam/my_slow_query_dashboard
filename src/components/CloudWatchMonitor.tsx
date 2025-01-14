import React, { useState } from 'react';
import { startCloudWatchCollection, getCloudWatchStatus } from '../api/queries';
import { CollectionResponse } from '../types/api';
import { Calendar } from 'lucide-react';

export function CloudWatchMonitor() {
  const [date, setDate] = useState<string>('');
  const [response, setResponse] = useState<CollectionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartCollection = async () => {
    try {
      setLoading(true);
      const result = await startCloudWatchCollection(date);
      setResponse(result);
    } catch (error) {
      console.error('Error starting collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!date) return;
    try {
      setLoading(true);
      const result = await getCloudWatchStatus(date);
      setResponse(result);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6" />
        CloudWatch Slow Query Monitor
      </h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-x-4">
        <button
          onClick={handleStartCollection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Start Collection
        </button>
        <button
          onClick={handleCheckStatus}
          disabled={loading || !date}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Check Status
        </button>
      </div>

      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="font-medium">Status: {response.status}</p>
          <p className="text-gray-600">{response.message}</p>
          <p className="text-sm text-gray-500">
            Last Updated: {new Date(response.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}