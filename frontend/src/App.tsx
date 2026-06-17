import { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Partition, DLQEntry, BrokerMetrics, BrokerLog, WebSocketMessage } from './types';
import { MetricsPanel } from './components/MetricsPanel';
import { ControlPanel } from './components/ControlPanel';
import { PartitionLanes } from './components/PartitionLanes';
import { DLQPanel } from './components/DLQPanel';
import { LogsTerminal } from './components/LogsTerminal';
import { Activity, Wifi } from 'lucide-react';

function App() {
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [dlqEntries, setDLQEntries] = useState<Array<{ id: string; entry: DLQEntry }>>([]);
  const [metrics, setMetrics] = useState<BrokerMetrics | null>(null);
  const [logs, setLogs] = useState<BrokerLog[]>([]);
  const [consumerActive, setConsumerActive] = useState(true);
  const [networkPartitionEnabled, setNetworkPartitionEnabled] = useState(false);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.event) {
      case 'initial-state': {
        const data = message.data as {
          partitions: Partition[];
          dlqEntries: Array<{ id: string; entry: DLQEntry }>;
          metrics: BrokerMetrics;
          logs: BrokerLog[];
          consumerActive: boolean;
        };
        setPartitions(data.partitions || []);
        setDLQEntries(data.dlqEntries || []);
        setMetrics(data.metrics || null);
        setLogs(data.logs || []);
        setConsumerActive(data.consumerActive);
        break;
      }
      case 'partitions-updated':
        setPartitions(message.data as Partition[]);
        break;
      case 'dlq-updated':
        setDLQEntries(message.data as Array<{ id: string; entry: DLQEntry }>);
        break;
      case 'metrics-updated':
        setMetrics(message.data as BrokerMetrics);
        break;
      case 'log':
        setLogs(prev => [...prev.slice(-99), message.data as BrokerLog]);
        break;
      case 'network-partition-enabled':
        setNetworkPartitionEnabled(true);
        break;
      case 'network-partition-disabled':
        setNetworkPartitionEnabled(false);
        break;
      default:
        break;
    }
  }, []);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  return (
    <div className="min-h-screen bg-broker-dark">
      <header className="bg-broker-card border-b border-broker-border shadow-lg">
        <div className="max-w-[2000px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Kafka Broker Controller
                  </h1>
                  <p className="text-sm text-gray-400">
                    Robotic Fulfillment Line - Event-Driven Simulation
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isConnected ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
              }`}>
                <Wifi className={`w-5 h-5 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
                <span className={`text-sm font-semibold ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[2000px] mx-auto px-6 py-6 space-y-6">
        <MetricsPanel metrics={metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PartitionLanes partitions={partitions} />
          </div>
          
          <div>
            <ControlPanel
              consumerActive={consumerActive}
              networkPartitionEnabled={networkPartitionEnabled}
              onConsumerToggle={setConsumerActive}
              onNetworkPartitionToggle={setNetworkPartitionEnabled}
            />
          </div>
        </div>

        <DLQPanel dlqEntries={dlqEntries} />

        <LogsTerminal logs={logs} />
      </main>

      <footer className="bg-broker-card border-t border-broker-border mt-12">
        <div className="max-w-[2000px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              Built by Principal Distributed Systems Engineer
            </div>
            <div className="flex items-center gap-4">
              <span>Production-Ready Lab Simulation</span>
              <span>•</span>
              <span>High-Throughput Event Processing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
