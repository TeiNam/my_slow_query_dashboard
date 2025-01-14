import React, { useState } from 'react';
import { Database, Hash, Clock, FileJson, Copy, Check } from 'lucide-react';
import { format } from 'sql-formatter';
import { ExplainPlan } from '../types/api';

interface QueryInformationProps {
    plan: ExplainPlan | null;
}

export function QueryInformation({ plan }: QueryInformationProps) {
    const [copied, setCopied] = useState(false);

    if (!plan) return null;

    const formattedQuery = format(plan.sql_text, {
        language: 'mysql',
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 2,
    });

    const handleCopyClick = async () => {
        try {
            await navigator.clipboard.writeText(formattedQuery);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy query:', err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center gap-2">
                    <FileJson className="w-5 h-5" />
                    Query Information
                </h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-500">Instance:</span>
                            <span className="text-sm text-gray-900">{plan.instance}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-500">PID:</span>
                            <span className="text-sm text-gray-900">{plan.pid}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-500">Execution Time:</span>
                            <span className="text-sm text-gray-900">{plan.time}s</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-500">SQL Query:</h4>
                            <button
                                onClick={handleCopyClick}
                                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                title="Copy SQL"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                        </div>
                        <pre className="p-4 bg-gray-50 rounded-md overflow-x-auto text-sm text-gray-900">
              {formattedQuery}
            </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}