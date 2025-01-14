import React, {useEffect, useState} from 'react';
import { collectQueryExplain } from '../api/queries';
import { ExplainResponse } from '../types/api';
import { Search, CheckCircle2, Hash, Download, Microscope } from 'lucide-react';

interface QueryExplainProps {
  selectedPid?: string;
}

export function QueryExplain({ selectedPid }: QueryExplainProps) {
  const [pid, setPid] = useState<string>(selectedPid || '');
  const [response, setResponse] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (selectedPid) {
      setPid(selectedPid);
    }
  }, [selectedPid]);

  const handleCollectExplain = async () => {
    if (!pid) return;
    try {
      setLoading(true);
      const result = await collectQueryExplain(parseInt(pid));
      setResponse(result);
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 3000);
    } catch (error) {
      console.error('Error collecting explain:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    if (!pid) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/mysql/explain/${pid}/markdown`);
      if (!response.ok) {
        throw new Error('Failed to download markdown');
      }

      const blob = await response.blob();
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '').slice(0, 15);
      const fileName = `instance_pid_${pid}_${timestamp}.md`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading markdown:', error);
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
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              value={pid}
              onChange={(e) => {
                if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                  setPid(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PID"
          />
        </div>

        <div className="space-x-4">
          <button
              onClick={handleCollectExplain}
              disabled={loading || !pid}
              className="bg-blue-500 text-white h-10 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Microscope className="w-4 h-4" />
            Collect Explain
          </button>
          <button
              onClick={handleDownloadMarkdown}
              disabled={loading || !pid}
              className="bg-green-500 text-white h-10 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Markdown
          </button>
        </div>

        {showSaveConfirm && (
            <div className="mt-4 p-4 bg-green-50 rounded-md flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span>Explain 정보가 저장되었습니다.</span>
            </div>
        )}

        {response && !showSaveConfirm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Hash className="w-4 h-4" />
                <span>PID: {response.pid}</span>
              </div>
              <div className="text-gray-600">Instance: {response.instance_name}</div>
              <div className="text-sm text-gray-500">
                Last Updated: {new Date(response.timestamp).toLocaleString()}
              </div>
            </div>
        )}
      </div>
  );
}