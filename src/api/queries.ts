const API_BASE = 'http://localhost:8000';  // /api/v1 제거

export async function startCloudWatchCollection(targetDate?: string) {
  const response = await fetch(`${API_BASE}/cloudwatch/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_date: targetDate }),
  });
  return response.json();
}

export async function getCloudWatchStatus(targetDate: string) {
  const response = await fetch(`${API_BASE}/cloudwatch/status/${targetDate}`);
  return response.json();
}

export async function startMySQLMonitoring() {
  const response = await fetch(`${API_BASE}/mysql/start`, {
    method: 'POST',
  });
  return response.json();
}

export async function stopMySQLMonitoring() {
  const response = await fetch(`${API_BASE}/mysql/stop`, {
    method: 'POST',
  });
  return response.json();
}

export async function getMySQLStatus() {
  const response = await fetch(`${API_BASE}/mysql/status`);
  return response.json();
}

export async function collectQueryExplain(pid: number) {
  const response = await fetch(`${API_BASE}/mysql/explain/${pid}`, {
    method: 'POST',
  });
  return response.json();
}

export async function collectRDSInstances() {
  const response = await fetch(`${API_BASE}/collectors/rds-instances`, {
    method: 'POST',
  });
  return response.json();
}

export async function getRDSInstances() {
  const response = await fetch(`${API_BASE}/rds-instances`);
  return response.json();
}

export async function getSlowQueryStats() {
  const response = await fetch(`${API_BASE}/cw-slowquery/digest/stats`);
  return response.json();
}