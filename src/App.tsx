import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Database, CloudCog, Share2, Server } from 'lucide-react';
import { MySQLMonitorPage } from './pages/MySQLMonitorPage';
import { CloudWatchPage } from './pages/CloudWatchPage';
import { PlanVisualizationPage } from './pages/PlanVisualizationPage';
import { RDSInstancePage } from './pages/RDSInstancePage';
import { useState, useEffect } from 'react';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

const futureFlags = {
  v7_startTransition: true,  // React.startTransition 적용 (경고 제거)
  v7_relativeSplatPath: true   // Splat 경로 변경 적용 (경고 제거)
};

function App() {
  const [awsAccount, setAwsAccount] = useState<string | null>(null);
  const [awsRegion, setAwsRegion] = useState<string | null>(null);

  useEffect(() => {
    const fetchAWSInfo = async () => {
      try {
        // 호스트네임에서 리전 추출 시도
        let region = 'ap-northeast-2';  // 기본값
        const hostname = window.location.hostname;
        if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
          const hostParts = hostname.split('.');
          if (hostParts[0].includes('-')) {
            region = hostParts[0];
          }
        }

        const stsClient = new STSClient({ region });

        const command = new GetCallerIdentityCommand({});
        const data = await stsClient.send(command);
        if (data.Account) {
          setAwsAccount(data.Account);
          setAwsRegion(region);
        }
      } catch (error) {
        console.error('AWS 자격 증명을 찾을 수 없습니다:', error);
        // 로컬 개발 환경에서는 기본값 설정
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          setAwsAccount('local-development');
          setAwsRegion('ap-northeast-2');
        }
      }
    };

    fetchAWSInfo();
  }, []);

  return (
      <Router future={futureFlags}>
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-white shadow-md">
            <div className="max-w-[80%] mx-auto px-4">
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

          <main className="max-w-[80%] mx-auto py-6">
            <Routes>
              <Route path="/" element={<MySQLMonitorPage />} />
              <Route path="/mysql" element={<MySQLMonitorPage />} />
              <Route path="/plan" element={<PlanVisualizationPage />} />
              <Route path="/cloudwatch" element={<CloudWatchPage />} />
              <Route path="/rds" element={<RDSInstancePage />} />
            </Routes>
          </main>
        </div>
      </Router>
  );
}

export default App;