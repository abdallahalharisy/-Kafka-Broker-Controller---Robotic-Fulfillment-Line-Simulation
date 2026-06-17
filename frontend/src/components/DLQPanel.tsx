import { useState } from 'react';
import { DLQEntry } from '../types';
import { AlertTriangle, Edit3, RotateCcw, Trash2, Clock } from 'lucide-react';
import { api } from '../services/api';

interface DLQPanelProps {
  dlqEntries: Array<{ id: string; entry: DLQEntry }>;
}

export const DLQPanel: React.FC<DLQPanelProps> = ({ dlqEntries }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPayload, setEditPayload] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const startEditing = (id: string, currentPayload: string) => {
    setEditingId(id);
    setEditPayload(currentPayload);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditPayload('');
  };

  const savePayload = async (dlqId: string) => {
    if (!editPayload.trim()) return;
    
    setIsLoading(true);
    try {
      await api.updateDLQPayload(dlqId, editPayload);
      setEditingId(null);
      setEditPayload('');
    } catch (error) {
      console.error('Failed to update payload:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubmit = async (dlqId: string) => {
    setIsLoading(true);
    try {
      await api.resubmitDLQMessage(dlqId);
    } catch (error) {
      console.error('Failed to resubmit message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (dlqId: string) => {
    setIsLoading(true);
    try {
      await api.deleteDLQEntry(dlqId);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-broker-card border border-dlq-danger/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-dlq-danger" />
          Dead-Letter Queue (Dark Store)
        </h2>
        <div className="px-3 py-1 bg-dlq-danger/20 border border-dlq-danger rounded-full">
          <span className="text-dlq-danger font-semibold">
            {dlqEntries.length} {dlqEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {dlqEntries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="mb-3 text-4xl">✓</div>
          <div className="text-lg">No messages in DLQ</div>
          <div className="text-sm mt-2">All messages processing successfully</div>
        </div>
      ) : (
        <div className="space-y-4">
          {dlqEntries.map(({ id, entry }) => {
            const isEditing = editingId === id;
            const isOffset27 = entry.message.offset === 27;

            return (
              <div
                key={id}
                className={`bg-broker-dark border-2 rounded-lg p-4 ${
                  isOffset27
                    ? 'border-red-600 bg-red-900/20'
                    : 'border-dlq-danger/50'
                } animate-slide-down`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isOffset27 && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">
                          🔴 OFFSET #27 POISON PILL
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        entry.status === 'pending'
                          ? 'bg-yellow-600 text-white'
                          : entry.status === 'resubmitted'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {entry.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Original Partition: {entry.message.originalPartition}</div>
                      <div>Original Offset: #{entry.message.originalOffset}</div>
                      <div>Retry Count: {entry.message.retryCount}</div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Diverted: {formatTimestamp(entry.diversionTimestamp)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-2">Payload:</div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editPayload}
                        onChange={(e) => setEditPayload(e.target.value)}
                        className="w-full px-3 py-2 bg-broker-card border border-gray-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        disabled={isLoading}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => savePayload(id)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isLoading}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-900 rounded border border-gray-800 font-mono text-sm text-white break-all">
                      {entry.message.payload}
                    </div>
                  )}
                </div>

                {entry.errorHistory.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-2">Error History:</div>
                    <div className="p-2 bg-gray-900 rounded border border-gray-800 max-h-32 overflow-y-auto">
                      {entry.errorHistory.map((error, idx) => (
                        <div key={idx} className="text-xs text-red-400 mb-1 font-mono">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(id, entry.message.payload)}
                      disabled={isLoading}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Payload
                    </button>
                    <button
                      onClick={() => handleResubmit(id)}
                      disabled={isLoading}
                      className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Resubmit
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      disabled={isLoading}
                      className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
