export interface Message {
  id: string;
  offset: number;
  partition: number;
  payload: string;
  timestamp: number;
  retryCount: number;
  originalPartition?: number;
  originalOffset?: number;
  errorTrace?: string[];
}

export interface Partition {
  id: number;
  messages: Message[];
  committedOffset: number;
  currentOffset: number;
  logEndOffset: number;
}

export interface DLQEntry {
  message: Message;
  diversionTimestamp: number;
  errorHistory: string[];
  status: 'pending' | 'resubmitted' | 'archived';
}

export interface BrokerMetrics {
  messagesProduced: number;
  messagesConsumed: number;
  messagesInDLQ: number;
  targetRPS: number;
  currentRPS: number;
  uptime: number;
  uptimePercentage: number;
  partitionHealth: Map<number, 'healthy' | 'degraded' | 'blocked'>;
}

export interface BrokerLog {
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface NetworkPartitionConfig {
  enabled: boolean;
  affectedPartitions: number[];
  delayMs: number;
}

export interface WebSocketMessage {
  event: string;
  data: unknown;
}
