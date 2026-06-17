import React, { useState } from 'react';
import { api } from '../services/api';
import { Play, Pause, Plus, Skull, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface ControlPanelProps {
  consumerActive: boolean;
  networkPartitionEnabled: boolean;
  onConsumerToggle: (active: boolean) => void;
  onNetworkPartitionToggle: (enabled: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  consumerActive,
  networkPartitionEnabled,
  onConsumerToggle,
  onNetworkPartitionToggle
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleProduceNormal = async () => {
    setIsLoading(true);
    try {
      const itemId = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await api.produceMessage(`order_fulfillment:${itemId}:pick_location_A${Math.floor(Math.random() * 50)}`);
    } catch (error) {
      console.error('Failed to produce message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProducePoison = async () => {
    setIsLoading(true);
    try {
      const itemId = `poison_${Date.now()}`;
      await api.producePoisonMessage(itemId);
    } catch (error) {
      console.error('Failed to produce poison message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProduceOffset27 = async () => {
    setIsLoading(true);
    try {
      await api.produceOffset27Message();
    } catch (error) {
      console.error('Failed to produce offset #27 message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsumerToggle = async () => {
    setIsLoading(true);
    try {
      if (consumerActive) {
        await api.stopConsumer();
        onConsumerToggle(false);
      } else {
        await api.startConsumer();
        onConsumerToggle(true);
      }
    } catch (error) {
      console.error('Failed to toggle consumer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNetworkPartitionToggle = async () => {
    setIsLoading(true);
    try {
      const enabled = !networkPartitionEnabled;
      await api.setNetworkPartition(enabled, [0, 1], 5000);
      onNetworkPartitionToggle(enabled);
    } catch (error) {
      console.error('Failed to toggle network partition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-broker-card border border-broker-border rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Play className="w-5 h-5 text-green-400" />
        Control Center
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Consumer Worker</h3>
          <button
            onClick={handleConsumerToggle}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              consumerActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {consumerActive ? (
              <>
                <Pause className="w-5 h-5" />
                Stop Consumer
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Consumer
              </>
            )}
          </button>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Message Production</h3>
          <div className="space-y-2">
            <button
              onClick={handleProduceNormal}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Produce Normal Message
            </button>

            <button
              onClick={handleProducePoison}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Skull className="w-5 h-5" />
              Produce Poison Pill (:fail)
            </button>

            <button
              onClick={handleProduceOffset27}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="w-5 h-5" />
              Inject Offset #27 Poison Pill
            </button>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Network Simulation</h3>
          <button
            onClick={handleNetworkPartitionToggle}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              networkPartitionEnabled
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {networkPartitionEnabled ? (
              <>
                <Wifi className="w-5 h-5" />
                Restore Network
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                Simulate Network Partition
              </>
            )}
          </button>
          {networkPartitionEnabled && (
            <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <p className="text-xs text-yellow-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Circuit Breaker Active - Partitions 0 & 1 degraded
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
