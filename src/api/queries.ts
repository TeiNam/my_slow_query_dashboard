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
  const response = await fetch(`${baseUrl}/aws-info`);
  if (!response.ok) {
    throw new Error('Failed to fetch AWS info');
  }
  return response.json();
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