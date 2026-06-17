import React from 'react';
import { BrokerMetrics } from '../types';
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface MetricsPanelProps {
  metrics: BrokerMetrics | null;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  if (!metrics) return null;

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-broker-card border border-broker-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          System Metrics
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${metrics.uptimePercentage >= 99.9 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-broker-dark rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Target RPS</div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(metrics.targetRPS)}
          </div>
          <div className="text-xs text-gray-500 mt-1">requests/sec</div>
        </div>

        <div className="bg-broker-dark rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Current RPS</div>
          <div className="text-2xl font-bold text-green-400 flex items-center gap-2">
            {formatNumber(metrics.currentRPS)}
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {((metrics.currentRPS / metrics.targetRPS) * 100).toFixed(1)}% capacity
          </div>
        </div>

        <div className="bg-broker-dark rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">SLA Uptime</div>
          <div className="text-2xl font-bold text-green-400 flex items-center gap-2">
            {metrics.uptimePercentage.toFixed(3)}%
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatUptime(metrics.uptime)} elapsed
          </div>
        </div>

        <div className="bg-broker-dark rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">DLQ Messages</div>
          <div className={`text-2xl font-bold flex items-center gap-2 ${metrics.messagesInDLQ > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {metrics.messagesInDLQ}
            {metrics.messagesInDLQ > 0 && <AlertTriangle className="w-4 h-4" />}
          </div>
          <div className="text-xs text-gray-500 mt-1">isolated messages</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-broker-dark rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm mb-2">Messages Produced</div>
          <div className="text-3xl font-bold text-blue-400">
            {formatNumber(metrics.messagesProduced)}
          </div>
        </div>

        <div className="bg-broker-dark rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm mb-2">Messages Consumed</div>
          <div className="text-3xl font-bold text-purple-400">
            {formatNumber(metrics.messagesConsumed)}
          </div>
        </div>
      </div>

      <div className="bg-broker-dark rounded-lg p-4 border border-gray-800">
        <div className="text-gray-400 text-sm mb-3">Partition Health</div>
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(partitionId => {
            const health = metrics.partitionHealth instanceof Map 
              ? metrics.partitionHealth.get(partitionId)
              : (metrics.partitionHealth as unknown as Record<string, string>)[partitionId.toString()];
            
            const healthColor = health === 'healthy' 
              ? 'bg-green-500' 
              : health === 'degraded' 
              ? 'bg-yellow-500' 
              : 'bg-red-500';

            return (
              <div key={partitionId} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${healthColor} ${health === 'healthy' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-gray-300">Partition {partitionId}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
