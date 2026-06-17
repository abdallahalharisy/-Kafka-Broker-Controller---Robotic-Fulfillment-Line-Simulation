import { EventEmitter } from 'events';
import { BrokerMetrics } from './types';
import { MockKafkaBroker } from './MockKafkaBroker';
import { DLQManager } from './DLQManager';

export class MetricsSimulator extends EventEmitter {
  private metrics: BrokerMetrics;
  private startTime: number;
  private metricsInterval: NodeJS.Timeout | null = null;
  private rpsSimulationInterval: NodeJS.Timeout | null = null;
  private readonly TARGET_RPS = 250005;
  private readonly TARGET_UPTIME_PERCENTAGE = 99.999;

  constructor(
    private broker: MockKafkaBroker,
    private dlqManager: DLQManager
  ) {
    super();
    this.startTime = Date.now();
    
    this.metrics = {
      messagesProduced: 0,
      messagesConsumed: 0,
      messagesInDLQ: 0,
      targetRPS: this.TARGET_RPS,
      currentRPS: 0,
      uptime: 0,
      uptimePercentage: this.TARGET_UPTIME_PERCENTAGE,
      partitionHealth: new Map([
        [0, 'healthy'],
        [1, 'healthy'],
        [2, 'healthy'],
        [3, 'healthy']
      ])
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.broker.on('message-produced', () => {
      this.metrics.messagesProduced++;
    });

    this.broker.on('offset-committed', () => {
      this.metrics.messagesConsumed++;
    });

    this.dlqManager.on('message-diverted', () => {
      this.metrics.messagesInDLQ = this.dlqManager.getDLQSize();
    });

    this.dlqManager.on('message-deleted', () => {
      this.metrics.messagesInDLQ = this.dlqManager.getDLQSize();
    });

    this.broker.on('network-partition-enabled', (config) => {
      for (const partitionId of config.affectedPartitions) {
        this.metrics.partitionHealth.set(partitionId, 'degraded');
      }
    });

    this.broker.on('network-partition-disabled', () => {
      for (let i = 0; i < 4; i++) {
        this.metrics.partitionHealth.set(i, 'healthy');
      }
    });
  }

  public start(): void {
    if (this.metricsInterval) return;

    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
      this.emit('metrics-updated', this.getMetrics());
    }, 1000);

    this.rpsSimulationInterval = setInterval(() => {
      this.simulateRPS();
    }, 100);

    this.broker.addLog('INFO', 'MetricsSimulator', 'Started metrics collection and RPS simulation');
  }

  public stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.rpsSimulationInterval) {
      clearInterval(this.rpsSimulationInterval);
      this.rpsSimulationInterval = null;
    }

    this.broker.addLog('INFO', 'MetricsSimulator', 'Stopped metrics collection');
  }

  private updateMetrics(): void {
    const currentTime = Date.now();
    this.metrics.uptime = Math.floor((currentTime - this.startTime) / 1000);

    const totalPartitions = 4;
    let healthyPartitions = 0;
    
    for (let i = 0; i < totalPartitions; i++) {
      const partition = this.broker.getPartition('robotic-fulfillment-orders', i);
      if (!partition) continue;

      const isHealthy = !this.broker.isPartitionAffectedByNetworkIssue(i);
      const hasBacklog = partition.messages.length > 10;

      if (!isHealthy) {
        this.metrics.partitionHealth.set(i, 'degraded');
      } else if (hasBacklog) {
        this.metrics.partitionHealth.set(i, 'degraded');
      } else {
        this.metrics.partitionHealth.set(i, 'healthy');
        healthyPartitions++;
      }
    }

    if (healthyPartitions === totalPartitions) {
      this.metrics.uptimePercentage = this.TARGET_UPTIME_PERCENTAGE;
    } else {
      const availabilityRatio = healthyPartitions / totalPartitions;
      this.metrics.uptimePercentage = Math.max(95.0, availabilityRatio * this.TARGET_UPTIME_PERCENTAGE);
    }

    this.metrics.messagesInDLQ = this.dlqManager.getDLQSize();
  }

  private simulateRPS(): void {
    const baseRPS = this.TARGET_RPS;
    const variance = baseRPS * 0.02;
    const randomVariance = (Math.random() - 0.5) * 2 * variance;
    
    const hasNetworkIssues = this.broker.isPartitionAffectedByNetworkIssue(0) || 
                              this.broker.isPartitionAffectedByNetworkIssue(1);
    
    let simulatedRPS = baseRPS + randomVariance;
    
    if (hasNetworkIssues) {
      simulatedRPS *= 0.7;
    }

    this.metrics.currentRPS = Math.floor(simulatedRPS);
  }

  public getMetrics(): BrokerMetrics {
    return {
      ...this.metrics,
      partitionHealth: new Map(this.metrics.partitionHealth)
    };
  }

  public resetMetrics(): void {
    this.startTime = Date.now();
    this.metrics = {
      messagesProduced: 0,
      messagesConsumed: 0,
      messagesInDLQ: this.dlqManager.getDLQSize(),
      targetRPS: this.TARGET_RPS,
      currentRPS: 0,
      uptime: 0,
      uptimePercentage: this.TARGET_UPTIME_PERCENTAGE,
      partitionHealth: new Map([
        [0, 'healthy'],
        [1, 'healthy'],
        [2, 'healthy'],
        [3, 'healthy']
      ])
    };

    this.broker.addLog('INFO', 'MetricsSimulator', 'Metrics reset');
    this.emit('metrics-reset');
  }

  public formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
