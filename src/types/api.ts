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
  explain_result?: {
    json: any;
    tree: string;
    error: string | null;
  };
}

export interface ExplainPlanListResponse {
  total: number;
  page: number;
  page_size: number;
  items: ExplainPlan[];
}

export interface RDSInstance {
  DBInstanceIdentifier: string;
  Engine: string;
  EngineVersion: string;
  DBInstanceStatus: string;
  Endpoint?: {
    Address: string;
    Port: number;
  };
  InstanceCreateTime: string;
  updateTime: string;
  Tags?: {
    [key: string]: string;
  };
}

export interface CollectRDSResponse {
  status: string;
  message: string;
  collected_count: number;
  details: {
    instance_ids: string[];
  };
}

// CloudWatch Slow Query Digest 관련 타입 수정
export interface AvgStats {
  avg_lock_time: number;
  avg_rows_examined: number;
  avg_rows_sent: number;
  avg_time: number;
}

export interface SumStats {
  execution_count: number;
  total_time: number;
}

export interface QueryStat {
  instance_id: string;
  digest_query: string;
  user: string;  // users 배열에서 단일 user 문자열로 변경
  avg_stats: AvgStats;
  sum_stats: SumStats;
}

export interface SlowQueryDigestResponse {
  month: string;
  stats: QueryStat[];
}