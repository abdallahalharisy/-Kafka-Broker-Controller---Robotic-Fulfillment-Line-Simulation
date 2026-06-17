import React, { useRef, useEffect } from 'react';
import { BrokerLog } from '../types';
import { Terminal, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface LogsTerminalProps {
  logs: BrokerLog[];
}

export const LogsTerminal: React.FC<LogsTerminalProps> = ({ logs }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
  };

  const getLevelColor = (level: BrokerLog['level']): string => {
    switch (level) {
      case 'INFO':
        return 'text-blue-400';
      case 'WARN':
        return 'text-yellow-400';
      case 'ERROR':
        return 'text-red-400';
      case 'DEBUG':
        return 'text-gray-400';
      default:
        return 'text-gray-300';
    }
  };

  const getLevelBadge = (level: BrokerLog['level']): string => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-900/50 text-blue-300';
      case 'WARN':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'ERROR':
        return 'bg-red-900/50 text-red-300';
      case 'DEBUG':
        return 'bg-gray-800 text-gray-400';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  const handleClearLogs = async () => {
    try {
      await api.clearLogs();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const handleScroll = () => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  return (
    <div className="bg-broker-card border border-broker-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-green-400" />
          Broker Logs Terminal
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-scroll
          </label>
          <button
            onClick={handleClearLogs}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div
        ref={terminalRef}
        onScroll={handleScroll}
        className="bg-black rounded-lg p-4 font-mono text-sm h-80 overflow-y-auto border border-gray-800"
      >
        {logs.length === 0 ? (
          <div className="text-gray-600 text-center py-8">
            No logs yet. System starting...
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="flex gap-3 hover:bg-gray-900/50 px-2 py-1 rounded">
                <span className="text-gray-500 shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${getLevelBadge(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-cyan-400 shrink-0">
                  [{log.source}]
                </span>
                <span className={getLevelColor(log.level)}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>{logs.length} log entries</span>
        <span className="mx-2">•</span>
        <span>Live monitoring active</span>
      </div>
    </div>
  );
};
