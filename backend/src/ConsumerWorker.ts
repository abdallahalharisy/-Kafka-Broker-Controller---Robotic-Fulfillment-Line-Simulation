import { EventEmitter } from 'events';
import { MockKafkaBroker } from './MockKafkaBroker';
import { DLQManager } from './DLQManager';
import { Message, ProcessingResult } from './types';

export class ConsumerWorker extends EventEmitter {
  private readonly MAX_RETRIES = 3;
  private readonly CONSUMER_GROUP_ID = 'robotic-fulfillment-workers';
  private readonly TOPIC_NAME = 'robotic-fulfillment-orders';
  private isRunning = false;
  private processingIntervals: Map<number, NodeJS.Timeout> = new Map();
  private currentlyProcessing: Map<number, Message | null> = new Map();
  private readonly POISON_OFFSET = 27;

  constructor(
    private broker: MockKafkaBroker,
    private dlqManager: DLQManager,
    private processingDelayMs: number = 1500
  ) {
    super();
  }

  public start(): void {
    if (this.isRunning) {
      this.broker.addLog('WARN', 'Consumer', 'Consumer worker already running');
      return;
    }

    this.isRunning = true;
    this.broker.addLog('INFO', 'Consumer', `Starting consumer group '${this.CONSUMER_GROUP_ID}'`);

    for (let partitionId = 0; partitionId < 4; partitionId++) {
      this.startPartitionConsumer(partitionId);
    }

    this.emit('worker-started');
  }

  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    for (const [partitionId, interval] of this.processingIntervals.entries()) {
      clearInterval(interval);
      this.broker.addLog('INFO', 'Consumer', `Stopped consumer for partition ${partitionId}`);
    }
    
    this.processingIntervals.clear();
    this.currentlyProcessing.clear();
    
    this.emit('worker-stopped');
  }

  private startPartitionConsumer(partitionId: number): void {
    this.currentlyProcessing.set(partitionId, null);

    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      if (this.broker.isPartitionAffectedByNetworkIssue(partitionId)) {
        this.broker.addLog('WARN', `Consumer-P${partitionId}`, 
          '⚠️ Circuit Breaker Tripped - Bounded Latency Tolerance Engaged'
        );
        return;
      }

      await this.processNextMessage(partitionId);
    }, this.processingDelayMs);

    this.processingIntervals.set(partitionId, interval);
  }

  private async processNextMessage(partitionId: number): Promise<void> {
    if (this.currentlyProcessing.get(partitionId)) {
      return;
    }

    const partition = this.broker.getPartition(this.TOPIC_NAME, partitionId);
    if (!partition || partition.messages.length === 0) {
      return;
    }

    const message = partition.messages[0];
    this.currentlyProcessing.set(partitionId, message);

    this.emit('message-processing-started', { partitionId, message });

    try {
      const result = await this.processMessage(message);

      if (result.success) {
        this.ack(message);
      } else {
        this.nack(message, result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown processing error';
      this.nack(message, errorMsg);
    } finally {
      this.currentlyProcessing.set(partitionId, null);
    }
  }

  private async processMessage(message: Message): Promise<ProcessingResult> {
    const networkDelay = this.broker.getNetworkDelayMs(message.partition);
    if (networkDelay > 0) {
      await this.delay(networkDelay);
    }

    if (message.offset === this.POISON_OFFSET && message.retryCount < this.MAX_RETRIES) {
      this.broker.addLog('ERROR', `Consumer-P${message.partition}`, 
        `🔴 Engineered poison pill detected at offset #${this.POISON_OFFSET} - Simulating failure (attempt ${message.retryCount + 1}/${this.MAX_RETRIES})`
      );
      return {
        success: false,
        message,
        error: `Poison pill at offset #${this.POISON_OFFSET} - Engineered failure`
      };
    }

    if (message.payload.includes(':fail')) {
      this.broker.addLog('ERROR', `Consumer-P${message.partition}`, 
        `Processing failed for message at offset ${message.offset} - Contains ':fail' marker (attempt ${message.retryCount + 1})`
      );
      return {
        success: false,
        message,
        error: 'Message contains :fail poison marker'
      };
    }

    const simulatedFailure = Math.random() < 0.02;
    if (simulatedFailure) {
      return {
        success: false,
        message,
        error: 'Simulated random processing failure (2% chance)'
      };
    }

    this.broker.addLog('DEBUG', `Consumer-P${message.partition}`, 
      `Successfully processed message at offset ${message.offset}`
    );

    return {
      success: true,
      message
    };
  }

  private ack(message: Message): void {
    this.broker.commitOffset(this.TOPIC_NAME, message.partition, message.offset);
    this.broker.removeMessage(this.TOPIC_NAME, message.partition, message.id);

    this.broker.addLog('INFO', `Consumer-P${message.partition}`, 
      `✓ ACK - Committed offset ${message.offset}`
    );

    this.emit('message-acked', { message });
  }

  private nack(message: Message, error: string): void {
    message.retryCount++;

    const errorHistory = message.errorTrace || [];
    errorHistory.push(`[Attempt ${message.retryCount}] ${error} - Timestamp: ${new Date().toISOString()}`);
    message.errorTrace = errorHistory;

    this.broker.addLog('WARN', `Consumer-P${message.partition}`, 
      `✗ NACK - Message at offset ${message.offset} failed (retry ${message.retryCount}/${this.MAX_RETRIES})`
    );

    if (message.retryCount > this.MAX_RETRIES) {
      this.broker.addLog('ERROR', `DLQ-Router`, 
        `🚨 MAX RETRIES EXCEEDED for offset ${message.offset} - Diverting to Dead-Letter Queue (dark store)`
      );

      this.broker.removeMessage(this.TOPIC_NAME, message.partition, message.id);
      
      const dlqId = this.dlqManager.divertToDLQ(message, errorHistory);

      this.emit('message-to-dlq', { message, dlqId });
    } else {
      this.emit('message-nacked', { message });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getCurrentlyProcessing(): Map<number, Message | null> {
    return new Map(this.currentlyProcessing);
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}
