export interface CollectionResponse {
  status: string;
  message: string;
  target_date: string;
  timestamp: string;
}

export interface MonitorResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface ExplainResponse {
  status: string;
  message: string;
  pid: number;
  instance_name: string;
  timestamp: string;
}

export interface SlowQuery {
  pid: number;
  instance: string;
  db: string;
  user: string;
  host: string;
  time: number;
  sql_text: string;
  start: string;
  end?: string;
}

export interface ExplainPlan {
  pid: number;
  created_at: string;
  instance: string;
  time: number;
  sql_text: string;
}

export interface ExplainPlanListResponse {
  total: number;
  page: number;
  page_size: number;
  items: ExplainPlan[];
}