import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Database, CloudCog, Share2, Server } from 'lucide-react';
import { MySQLMonitorPage } from './pages/MySQLMonitorPage';
import { CloudWatchPage } from './pages/CloudWatchPage';
import { PlanVisualizationPage } from './pages/PlanVisualizationPage';
import { RDSInstancePage } from './pages/RDSInstancePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Footer } from './components/Footer';
import { useState, useEffect, useCallback } from 'react';
import { getAWSInfo } from './api/queries';

const futureFlags = {
  v7_startTransition: true,  // React.startTransition 적용 (경고 제거)
  v7_relativeSplatPath: true   // Splat 경로 변경 적용 (경고 제거)
};

function App() {
  const [awsAccount, setAwsAccount] = useState<string | null>(null);
  const [awsRegion, setAwsRegion] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2초

  const fetchAWSInfo = useCallback(async () => {
    try {
      const awsInfo = await getAWSInfo();
      setAwsAccount(awsInfo.account);
      setAwsRegion(awsInfo.region);
      setRetryCount(0); // 성공시 재시도 카운트 초기화
      if (retryTimer) {
        clearTimeout(retryTimer);
        setRetryTimer(null);
      }
    } catch (err) {
      console.error(`AWS 정보를 가져오는데 실패했습니다 (시도 ${retryCount + 1}/${MAX_RETRIES}):`, err);

      // 재시도 로직
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        const timer = setTimeout(() => {
          console.log(`재시도 중... (${retryCount + 1}/${MAX_RETRIES})`);
          fetchAWSInfo();
        }, RETRY_DELAY);
        setRetryTimer(timer);
      } else {
        console.log('최대 재시도 횟수 초과, Unknown으로 설정');
        setAwsAccount('Unknown');
        setAwsRegion('Unknown');
      }
    }
  }, [retryCount, retryTimer]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [retryTimer]);

  useEffect(() => {
    fetchAWSInfo();
  }, [fetchAWSInfo]);

  return (
      <Router future={futureFlags}>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <nav className="bg-white shadow-md">
            <div className="w-full min-w-[1280px] max-w-[1920px] mx-auto px-4">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <div className="flex items-center gap-2">
                      <img src="/mysql.svg" alt="MySQL Logo" className="w-6 h-6" />
                      <h1 className="text-xl font-bold text-gray-900">MySQL Query Monitor</h1>
                    </div>
                  </div>
                  <div className="ml-6 flex space-x-8">
                    <Link
                        to="/mysql"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      MySQL Monitor
                    </Link>
                    <Link
                        to="/plan"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Plan Visualization
                    </Link>
                    <Link
                        to="/cloudwatch"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      <CloudCog className="w-4 h-4 mr-2" />
                      CloudWatch
                    </Link>
                    <Link
                        to="/rds"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      <Server className="w-4 h-4 mr-2" />
                      RDS Instances
                    </Link>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600 text-right mr-8">
                  {awsAccount && awsRegion ? (
                      <span>
                    <strong>AWS Account:</strong> {awsAccount} || <strong>Region:</strong> {awsRegion}
                  </span>
                  ) : (
                      <span>Loading AWS Info...</span>
                  )}
                </div>
              </div>
            </div>
          </nav>

          <main className="w-full min-w-[1280px] max-w-[1920px] mx-auto py-6">
            <Routes>
              <Route path="/" element={<MySQLMonitorPage />} />
              <Route path="mysql" element={<MySQLMonitorPage />} />
              <Route path="plan" element={<PlanVisualizationPage />} />
              <Route path="cloudwatch" element={<CloudWatchPage />} />
              <Route path="rds" element={<RDSInstancePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
  );
}

export default App;