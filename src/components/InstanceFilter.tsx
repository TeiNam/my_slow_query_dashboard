import { useState, useRef, useEffect } from 'react';
import { Database, Check, ChevronDown } from 'lucide-react';

interface InstanceFilterProps {
    instances: string[];
    selectedInstances: string[];
    onChange: (instances: string[]) => void;
}

export function InstanceFilter({ instances, selectedInstances, onChange }: InstanceFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSelectAll = () => {
        if (selectedInstances.length === instances.length) {
            onChange([]);
        } else {
            onChange([...instances]);
        }
    };

    const handleInstanceToggle = (instanceId: string) => {
        if (selectedInstances.includes(instanceId)) {
            onChange(selectedInstances.filter(id => id !== instanceId));
        } else {
            onChange([...selectedInstances, instanceId]);
        }
    };

    // 외부 클릭 감지
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 선택된 인스턴스 표시 텍스트
    const getDisplayText = () => {
        if (selectedInstances.length === 0) return '인스턴스 선택';
        if (selectedInstances.length === instances.length) return '전체 선택됨';
        return `${selectedInstances.length}개 선택됨`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{getDisplayText()}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-64 mt-1 bg-white border rounded-md shadow-lg">
                    <div className="p-2">
                        <label className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedInstances.length === instances.length}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">전체 선택</span>
                        </label>
                        <div className="my-1 border-t border-gray-200"></div>
                        <div className="max-h-48 overflow-y-auto">
                            {instances.map((instance, index) => (
                                <label
                                    key={instance}
                                    className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedInstances.includes(instance)}
                                        onChange={() => handleInstanceToggle(instance)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 flex-1" title={instance}>
                    {instance.length > 30 ? `${instance.substring(0, 30)}...` : instance}
                  </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}