import React, {useEffect, useState} from 'react';
import { collectQueryExplain, getExplainStatus } from '../api/queries';
import { ExplainResponse } from '../types/api';
import { Search } from 'lucide-react';

interface QueryExplainProps {
  selectedPid?: string;
}

export function QueryExplain({ selectedPid }: QueryExplainProps) {
  const [pid, setPid] = useState<string>(selectedPid || '');

  // selectedPid가 변경될 때마다 입력값 업데이트
  useEffect(() => {
    if (selectedPid) {
      setPid(selectedPid);
    }
  }, [selectedPid]);

  const [response, setResponse] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCollectExplain = async () => {
    if (!pid) return;
    try {
      setLoading(true);
      const result = await collectQueryExplain(parseInt(pid));
      setResponse(result);
    } catch (error) {
      console.error('Error collecting explain:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!pid) return;
    try {
      setLoading(true);
      const result = await getExplainStatus(parseInt(pid));
      setResponse(result);
    } catch (error) {
      console.error('Error checking explain status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Search className="w-6 h-6" />
        Query Explain
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Query PID
        </label>
        <input
          type="number"
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter PID"
        />
      </div>

      <div className="space-x-4">
        <button
          onClick={handleCollectExplain}
          disabled={loading || !pid}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Collect Explain
        </button>
        <button
          onClick={handleCheckStatus}
          disabled={loading || !pid}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Check Status
        </button>
      </div>

      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="font-medium">Status: {response.status}</p>
          <p className="text-gray-600">{response.message}</p>
          <p className="text-gray-600">Instance: {response.instance_name}</p>
          <p className="text-sm text-gray-500">
            Last Updated: {new Date(response.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}