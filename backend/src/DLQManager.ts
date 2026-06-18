import { v4 as uuidv4 } from 'uuid';
import { Message, DLQEntry } from './types';
import { EventEmitter } from 'events';

export class DLQManager extends EventEmitter {
  private dlqStore: Map<string, DLQEntry> = new Map();
  private readonly MAX_DLQ_SIZE = 10000;

  constructor() {
    super();
  }

  public divertToDLQ(message: Message, errorHistory: string[]): string {
    const dlqId = uuidv4();
    
    const entry: DLQEntry = {
      message: {
        ...message,
        originalPartition: message.partition,
        originalOffset: message.offset,
        errorTrace: errorHistory
      },
      diversionTimestamp: Date.now(),
      errorHistory,
      status: 'pending'
    };

    this.dlqStore.set(dlqId, entry);

    if (this.dlqStore.size > this.MAX_DLQ_SIZE) {
      const oldestKey = this.dlqStore.keys().next().value;
      if (oldestKey) {
        this.dlqStore.delete(oldestKey);
      }
    }

    this.emit('message-diverted', { dlqId, entry });

    return dlqId;
  }

  public getDLQEntry(dlqId: string): DLQEntry | undefined {
    return this.dlqStore.get(dlqId);
  }

  public getAllDLQEntries(): Array<{ id: string; entry: DLQEntry }> {
    return Array.from(this.dlqStore.entries()).map(([id, entry]) => ({ id, entry }));
  }

  public updatePayload(dlqId: string, newPayload: string): boolean {
    const entry = this.dlqStore.get(dlqId);
    if (!entry) return false;

    entry.message.payload = newPayload;
    this.emit('payload-updated', { dlqId, newPayload });
    return true;
  }

  public markAsResubmitted(dlqId: string): boolean {
    const entry = this.dlqStore.get(dlqId);
    if (!entry) return false;

    entry.status = 'resubmitted';
    this.emit('message-resubmitted', { dlqId, entry });
    return true;
  }

  public archiveEntry(dlqId: string): boolean {
    const entry = this.dlqStore.get(dlqId);
    if (!entry) return false;

    entry.status = 'archived';
    this.emit('message-archived', { dlqId });
    return true;
  }

  public deleteEntry(dlqId: string): boolean {
    const deleted = this.dlqStore.delete(dlqId);
    if (deleted) {
      this.emit('message-deleted', { dlqId });
    }
    return deleted;
  }

  public getDLQSize(): number {
    return this.dlqStore.size;
  }

  public clearDLQ(): void {
    this.dlqStore.clear();
    this.emit('dlq-cleared');
  }

  public getErrorStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const entry of this.dlqStore.values()) {
      const errorType = this.extractErrorType(entry.errorHistory);
      stats[errorType] = (stats[errorType] || 0) + 1;
    }

    return stats;
  }

  private extractErrorType(errorHistory: string[]): string {
    if (errorHistory.length === 0) return 'Unknown';
    
    const lastError = errorHistory[errorHistory.length - 1];
    if (lastError.includes('poison')) return 'Poison Message';
    if (lastError.includes('timeout')) return 'Timeout';
    if (lastError.includes('network')) return 'Network Error';
    if (lastError.includes('parsing')) return 'Parse Error';
    
    return 'Processing Error';
  }
}
