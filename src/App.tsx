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
  v7_relativeSplatPath: true // Splat 경로 변경 적용 (경고 제거)
};

function App() {
  const [awsAccount, setAwsAccount] = useState<string | null>(null);
  const [awsRegion, setAwsRegion] = useState<string | null>(null);

  useEffect(() => {
    const fetchAWSInfo = async () => {
      try {
        const stsClient = new STSClient({});
        const command = new GetCallerIdentityCommand({});
        const data = await stsClient.send(command);
        setAwsAccount(data.Account);

        // 현재 리전 정보 가져오기
        const region = window.location.hostname.split('.')[0]; // 예시로 리전 추출
        setAwsRegion(region);
      } catch (error) {
        console.error('Failed to fetch AWS info:', error);
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
                      <img src="/mysql.svg" alt="MySQL Logo" className="w-6 h-6"/>
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

                {/* AWS 계정 및 리전 정보 표시 */}
                <div className="flex items-center text-sm text-gray-600">
                  {awsAccount && awsRegion ? (
                      <span className="ml-4">
                    AWS Account: {awsAccount} | Region: {awsRegion}
                  </span>
                  ) : (
                      <span className="ml-4">Loading AWS Info...</span>
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