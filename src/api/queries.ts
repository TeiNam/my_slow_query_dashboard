import { getApiConfig } from '../config/api';

export async function startCloudWatchCollection(targetDate?: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/cloudwatch/status/${targetDate}`);
  return response.json();
}

export async function startMySQLMonitoring() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/mysql/start`, {
    method: 'POST',
  });
  return response.json();
}

export async function stopMySQLMonitoring() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/mysql/stop`, {
    method: 'POST',
  });
  return response.json();
}

export async function getMySQLStatus() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/mysql/status`);
  return response.json();
}

export async function collectQueryExplain(pid: number) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/mysql/explain/${pid}`, {
    method: 'POST',
  });
  return response.json();
}

export async function collectRDSInstances() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/collectors/rds-instances`, {
    method: 'POST',
  });
  return response.json();
}

export async function getRDSInstances() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${baseUrl}/rds-instances`);
    if (!response.ok) {
      if (response.status === 500) {
        throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      throw new Error(`RDS 인스턴스 조회 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('서버 응답 형식이 올바르지 않습니다.');
    }
    return data;
  } catch (error) {
    console.error('RDS 인스턴스 조회 중 오류:', error);
    throw error;
  }
}

export async function getSlowQueryStats() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/cw-slowquery/digest/stats`);
  return response.json();
}