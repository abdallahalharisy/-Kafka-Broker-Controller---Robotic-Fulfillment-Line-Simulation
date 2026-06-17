import { v4 as uuidv4 } from 'uuid';
import { Message, Partition, Topic, BrokerLog, NetworkPartitionConfig } from './types';
import { EventEmitter } from 'events';

export class MockKafkaBroker extends EventEmitter {
  private topics: Map<string, Topic> = new Map();
  private logs: BrokerLog[] = [];
  private networkPartitionConfig: NetworkPartitionConfig = {
    enabled: false,
    affectedPartitions: [],
    delayMs: 0
  };
  private roundRobinCounter = 0;

  constructor() {
    super();
    this.initializeTopic('robotic-fulfillment-orders');
  }

  private initializeTopic(topicName: string): void {
    const partitions = new Map<number, Partition>();
    
    for (let i = 0; i < 4; i++) {
      partitions.set(i, {
        id: i,
        messages: [],
        committedOffset: -1,
        currentOffset: -1,
        logEndOffset: 0
      });
    }

    this.topics.set(topicName, {
      name: topicName,
      partitions
    });

    this.addLog('INFO', 'Broker', `Initialized topic '${topicName}' with 4 partitions`);
  }

  public produce(topicName: string, payload: string, key?: string): Message {
    const topic = this.topics.get(topicName);
    if (!topic) {
      throw new Error(`Topic '${topicName}' not found`);
    }

    const partitionId = this.selectPartition(payload, key, topic);
    const partition = topic.partitions.get(partitionId)!;

    const message: Message = {
      id: uuidv4(),
      offset: partition.logEndOffset,
      partition: partitionId,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };

    partition.messages.push(message);
    partition.logEndOffset++;

    this.addLog('INFO', `Broker-Partition-${partitionId}`, 
      `Produced message at offset ${message.offset} | Payload: ${payload.substring(0, 50)}${payload.length > 50 ? '...' : ''}`
    );

    this.emit('message-produced', { topicName, message });

    return message;
  }

  private selectPartition(payload: string, key: string | undefined, topic: Topic): number {
    if (payload.includes(':fail')) {
      const poisonPartition = Math.random() < 0.5 ? 0 : 1;
      this.addLog('WARN', 'Broker-Router', 
        `Detected poison payload containing ':fail' - Routing to Partition ${poisonPartition}`
      );
      return poisonPartition;
    }

    if (key) {
      const hash = this.hashCode(key);
      return Math.abs(hash) % topic.partitions.size;
    }

    const partitionId = this.roundRobinCounter % topic.partitions.size;
    this.roundRobinCounter++;
    return partitionId;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  public getPartition(topicName: string, partitionId: number): Partition | undefined {
    const topic = this.topics.get(topicName);
    return topic?.partitions.get(partitionId);
  }

  public getAllPartitions(topicName: string): Partition[] {
    const topic = this.topics.get(topicName);
    if (!topic) return [];
    return Array.from(topic.partitions.values());
  }

  public commitOffset(topicName: string, partitionId: number, offset: number): void {
    const partition = this.getPartition(topicName, partitionId);
    if (partition) {
      partition.committedOffset = offset;
      this.addLog('DEBUG', `Broker-Partition-${partitionId}`, `Committed offset ${offset}`);
      this.emit('offset-committed', { topicName, partitionId, offset });
    }
  }

  public removeMessage(topicName: string, partitionId: number, messageId: string): boolean {
    const partition = this.getPartition(topicName, partitionId);
    if (!partition) return false;

    const index = partition.messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      partition.messages.splice(index, 1);
      this.addLog('INFO', `Broker-Partition-${partitionId}`, `Removed message ${messageId}`);
      return true;
    }
    return false;
  }

  public setNetworkPartition(config: NetworkPartitionConfig): void {
    this.networkPartitionConfig = config;
    if (config.enabled) {
      this.addLog('ERROR', 'Broker-Network', 
        `⚠️ NETWORK PARTITION SIMULATED - Affected partitions: [${config.affectedPartitions.join(', ')}] - Delay: ${config.delayMs}ms`
      );
      this.emit('network-partition-enabled', config);
    } else {
      this.addLog('INFO', 'Broker-Network', 'Network partition simulation disabled - Normal operation resumed');
      this.emit('network-partition-disabled');
    }
  }

  public isPartitionAffectedByNetworkIssue(partitionId: number): boolean {
    return this.networkPartitionConfig.enabled && 
           this.networkPartitionConfig.affectedPartitions.includes(partitionId);
  }

  public getNetworkDelayMs(partitionId: number): number {
    return this.isPartitionAffectedByNetworkIssue(partitionId) 
      ? this.networkPartitionConfig.delayMs 
      : 0;
  }

  public addLog(level: BrokerLog['level'], source: string, message: string, metadata?: Record<string, unknown>): void {
    const log: BrokerLog = {
      timestamp: Date.now(),
      level,
      source,
      message,
      metadata
    };
    this.logs.push(log);
    
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    this.emit('log', log);
  }

  public getLogs(limit: number = 100): BrokerLog[] {
    return this.logs.slice(-limit);
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public getTopicState(topicName: string): Topic | undefined {
    return this.topics.get(topicName);
  }
}
