import { getApiConfig } from '../config/api';

export interface AWSInfo {
  account: string;
  region: string;
}

async function getBaseUrl(): Promise<string> {
  return getApiConfig().baseUrl;
}

export async function getAWSInfo(): Promise<AWSInfo> {
  const baseUrl = await getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/aws/info`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch AWS info: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('AWS 정보를 가져오는데 실패했습니다:', error);
    throw error;
  }
}

export async function startCloudWatchCollection(targetDate?: string) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/cloudwatch/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_date: targetDate }),
  });
  return response.json();
}

export async function getCloudWatchStatus(targetDate: string) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/cloudwatch/status/${targetDate}`);
  return response.json();
}

export async function startMySQLMonitoring() {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/mysql/start`, {
    method: 'POST',
  });
  return response.json();
}

export async function stopMySQLMonitoring() {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/mysql/stop`, {
    method: 'POST',
  });
  return response.json();
}

export async function getMySQLStatus() {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/mysql/status`);
  return response.json();
}

export async function collectQueryExplain(pid: number) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/mysql/explain/${pid}`, {
    method: 'POST',
  });
  return response.json();
}

export async function collectRDSInstances() {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/collectors/rds-instances`, {
    method: 'POST',
  });
  return response.json();
}

export async function getRDSInstances() {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/rds-instances`);
  return response.json();
}

export async function getSlowQueryStats() {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/cw-slowquery/digest/stats`);
  return response.json();
}

export async function calculateSQLStatistics(yearMonth: string) {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/sql/statistics/calculate/${yearMonth}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => {
        return { detail: `HTTP 오류: ${response.status} ${response.statusText}` };
      });
      console.error('통계 계산 API 응답 오류:', errorData);
      return {
        status: 'error',
        message: `통계 계산에 실패했습니다: ${errorData.detail || response.statusText}`,
        error: errorData
      };
    }

    return response.json();
  } catch (error) {
    console.error('SQL 통계 계산 중 에러 발생:', error);
    return {
      status: 'error',
      message: `통계 계산 중 예외가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    };
  }
}

export async function calculateUserStatistics(yearMonth: string) {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/sql/statistics/users/calculate/${yearMonth}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => {
        return { detail: `HTTP 오류: ${response.status} ${response.statusText}` };
      });
      console.error('사용자 통계 계산 API 응답 오류:', errorData);
      return {
        status: 'error',
        message: `사용자 통계 계산에 실패했습니다: ${errorData.detail || response.statusText}`,
        error: errorData
      };
    }

    return response.json();
  } catch (error) {
    console.error('사용자 통계 계산 중 에러 발생:', error);
    return {
      status: 'error',
      message: `사용자 통계 계산 중 예외가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    };
  }
}

export async function getSQLStatistics(yearMonth: string, instanceIds?: string[]) {
  const baseUrl = await getBaseUrl();
  let url = `${baseUrl}/sql/statistics/${yearMonth}`; // /api/v1 추가

  if (instanceIds && instanceIds.length > 0) {
    const params = new URLSearchParams();
    instanceIds.forEach(id => params.append('instance_ids', id));
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  return response.json();
}

export async function getUserStatistics(yearMonth: string, instanceIds?: string[]) {
  const baseUrl = await getBaseUrl();
  let url = `${baseUrl}/sql/statistics/users/${yearMonth}`; // /api/v1 추가

  if (instanceIds && instanceIds.length > 0) {
    const params = new URLSearchParams();
    instanceIds.forEach(id => params.append('instance_ids', id));
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  return response.json();
}