import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-red-500 mb-4">
                <AlertTriangle size={64} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">페이지를 찾을 수 없습니다</p>
            <p className="text-gray-500">3초 후 홈페이지로 이동합니다...</p>
            <button
                onClick={() => navigate('/')}
                className="mt-8 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
                홈으로 바로가기
            </button>
        </div>
    );
}