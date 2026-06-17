import React from 'react';
import { Partition, Message } from '../types';
import { Clock, AlertTriangle } from 'lucide-react';

interface PartitionLanesProps {
  partitions: Partition[];
}

const PARTITION_COLORS = [
  'border-partition-0 bg-partition-0/10',
  'border-partition-1 bg-partition-1/10',
  'border-partition-2 bg-partition-2/10',
  'border-partition-3 bg-partition-3/10'
];

const PARTITION_TEXT_COLORS = [
  'text-partition-0',
  'text-partition-1',
  'text-partition-2',
  'text-partition-3'
];

export const PartitionLanes: React.FC<PartitionLanesProps> = ({ partitions }) => {
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const truncatePayload = (payload: string, maxLength: number = 30): string => {
    if (payload.length <= maxLength) return payload;
    return payload.substring(0, maxLength) + '...';
  };

  const renderMessage = (message: Message) => {
    const isPoison = message.payload.includes(':fail');
    const isOffset27 = message.offset === 27;

    return (
      <div
        key={message.id}
        className={`p-3 rounded-lg border-2 ${
          isOffset27
            ? 'bg-red-900/40 border-red-600'
            : isPoison
            ? 'bg-orange-900/30 border-orange-600'
            : 'bg-gray-800 border-gray-700'
        } mb-2 animate-slide-up transition-all hover:scale-105`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">
              Offset #{message.offset}
            </span>
            {isOffset27 && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-bold">
                POISON #27
              </span>
            )}
            {isPoison && !isOffset27 && (
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            )}
          </div>
          {message.retryCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
              Retry {message.retryCount}/3
            </span>
          )}
        </div>
        
        <div className="text-sm text-white font-mono mb-2">
          {truncatePayload(message.payload)}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-broker-card border border-broker-border rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Active Message Lanes (FIFO Partitions)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {partitions.map((partition) => (
          <div
            key={partition.id}
            className={`border-2 rounded-lg p-4 ${PARTITION_COLORS[partition.id]}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-lg ${PARTITION_TEXT_COLORS[partition.id]}`}>
                Partition {partition.id}
              </h3>
              <div className="text-right">
                <div className="text-xs text-gray-400">LEO</div>
                <div className={`text-lg font-bold ${PARTITION_TEXT_COLORS[partition.id]}`}>
                  {partition.logEndOffset}
                </div>
              </div>
            </div>

            <div className="mb-3 p-2 bg-broker-dark rounded">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Committed:</span>
                <span className="font-mono">{partition.committedOffset}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>In Queue:</span>
                <span className="font-mono">{partition.messages.length}</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {partition.messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <div className="mb-2">✓</div>
                  <div>No pending messages</div>
                </div>
              ) : (
                partition.messages.slice(0, 10).map(renderMessage)
              )}
              {partition.messages.length > 10 && (
                <div className="text-center text-xs text-gray-500 py-2">
                  +{partition.messages.length - 10} more messages
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
